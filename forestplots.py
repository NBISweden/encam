%load_ext rpy2.ipython

%%R
# install.packages(c('gdata','ggplot2','reshape','survival','rms','tidyverse','schoRsch','DescTools'))
# install.packages("BiocManager")
# library(BiocManager)
# BiocManager::install('made4')
# BiocManager::install('metafor')
require(gdata)
library(made4)
require(ggplot2)
library(reshape)
library(survival)
library(rms)
library(tidyverse)
library(schoRsch)
library(DescTools)

%%html
First each column is binned

%%R
dat <- NULL
# dat <- read.table("Made up immune data.txt", sep="\t", header=T, fill = T,dec = ",")
dat <- read.csv("./made-up-data.csv")
head(dat)
dat$status <-(dat$Event_last_followup)
dat$SurvObj <- with(dat, Surv(Time_Diagnosis_Last_followup, status == "Dead"))
# select tumor type, to analyse
dat2 <- dat[ which(
    dat$cohort == 'Colon' &
    dat$PreOp_treatment_yesno == 'No'), ]
# dichotomise variables based on median
for(i in names(dat2[,c( 8:33)] )){
  x  <-  as.data.frame(dat2[!is.na(dat2[i]),])
  x[i] <- ntiles(x, dv = i, bins=2)
  f <- "PatID"
  dat2 <- merge( dat2,  x[,c(f,i)], by = f, all = T)
  }

%%R
dat2_copy <- cbind(dat2)
dat2_copy$SurvObj <- NULL

dat2_R = %Rget dat2_copy
dat2_R

import pandas as pd

# https://rdrr.io/cran/schoRsch/src/R/ntiles.R
ntiles = lambda xs: pd.cut(pd.Series(xs).rank(), 2, right=False, labels=False) + 1

dat2_py = pd.read_csv("./made-up-data.csv")
dat2_py = dat2_py[ dat2_py['PreOp_treatment_yesno'] == 'No' ]
dat2_py = dat2_py[ dat2_py['cohort'] == 'Colon' ]
types = dat2_py.columns[7:]
for i in types:
    x = dat2_py[i]
    dat2_py[i + '.y'] = ntiles(dat2_py[i])
dat2_py

for i in types:
    py = dat2_py[i + '.y'].reset_index()
    R = dat2_R[i + '.y'].reset_index()
    if not all(py == R):
        print(f'Incorrect binning of {i}')

%%R
data<- dat2
# selecting variables for survival analysis - in this case variables are ALL immune cell data, dichotomised high vs low
covariates <- colnames(data[,c(36:61)])
# compution variables for survival
univ_formulas <- sapply(covariates,
                        function(x) as.formula(paste('SurvObj~', x)))
univ_models <- lapply( univ_formulas, function(x){coxph(x, data = data)})
# Extract data
univ_results <- lapply(univ_models,
                       function(x){
                         x <- summary(x)
                         p.value<-signif(x$wald["pvalue"], digits=3)
                         wald.test<-signif(x$wald["test"], digits=2)
                         beta<-signif(x$coef[1], digits=2);#coeficient beta
                         HR <-signif(x$coef[2], digits=2);#exp(beta)
                         HR.confint.lower <- signif(x$conf.int[,"lower .95"], 2)
                         HR.confint.upper <- signif(x$conf.int[,"upper .95"],2)
                         HR <- paste0(HR, " (",
                                      HR.confint.lower, "-", HR.confint.upper, ")")


                         coef<-signif(x$coef[1], digits=3);#coeficient beta
                         se.coef<-signif(x$coef[3], digits=3);#coeficient se(coef)

                         res<-c(beta, HR, wald.test, p.value, coef, se.coef)
                         names(res)<-c("beta", "HR (95% CI for HR)", "wald.test",
                                       "p.value", "coef", "se.coef")

                         return(res)
                         #return(exp(cbind(coef(x),confint(x))))
                       })
Cox <- t(as.data.frame(univ_results, check.names = F))
Cox <- data.frame(Cox)

Cox_R = %Rget Cox
Cox_R

# !pip install --user lifelines
from lifelines import CoxPHFitter

dd = dat2_py
dd['T'] = dd['Time_Diagnosis_Last_followup']
dd['E'] = dd['Event_last_followup'] == 'Dead'
covariates = [ c for c in dd.columns if c.endswith('.y') ]
TE = ['T', 'E']

univ_results = {}
for c in covariates:
    dd_c = dd[ [c] + TE ]
    dd_c = dd_c[~pd.isnull(dd_c).any(axis=1)]
    # dd_c = dd_c[~pd.isnull(dd).any(axis=1)]
    # My main questions to them:
    # - Why is there NA in their data?
    # - Why not remove all rows with NA instead of those that are NA for the current column?
    cph = CoxPHFitter()
    cph.fit(dd_c, 'T', event_col='E')
    univ_results[c] = cph

Cox_py = pd.concat([v.summary for v in univ_results.values()])
Cox_py

%%html
Results between R and python versions match up. The row names are slightly different but here they are side by side.

Cox_both = pd.concat([Cox_py, Cox_R], axis=1)
Cox_both[['coef', 'beta', 'exp(coef)', 'exp(coef) lower 95%', 'exp(coef) upper 95%', 'HR..95..CI.for.HR.', 'p', 'p.value']]

%%html
The rest of their R code is a meta-analysis. I think this is done to get the summary estimate written at the end of the forest plot.
I think this also sets weight sizes of the squares in the forest plot.

'z'

%%R -w 12 -h 12 --units in
library(metafor)
###########################
#### remove 'y' from names
names <- row.names(Cox)
foo = function(x){
  return(gsub(".y","",x))
}
names <-foo(names)
colnames(Cox)
labs <- names
yi   <- as.numeric(as.character(Cox$coef))
sei  <- as.numeric(as.character(Cox$se.coef))
p.vals  <- as.numeric(as.character(Cox$p.value))
str(p.vals)
p.vals  <- as.numeric(p.vals)
# Combine data into summary estimate
res  <- rma(yi=yi, sei=sei, method="FE")
summary(res)
#
# Format pvalues so only those bellow 0.01 are scientifically notated
p.vals <- ifelse(p.vals < 0.001,
                 format(p.vals,digits = 3,scientific = TRUE,trim = TRUE),
                 format(round(p.vals, 3), nsmall=2, trim=TRUE))
p.vals <- gsub('e(.*)', ' x 10^\\1', p.vals)
# Plot combined data
# options(repr.plot.width=8, repr.plot.height=7)
forest(res, transf=exp, refline=1, xlab="HR (95%CI)",
       slab=labs, ilab = p.vals, ilab.xpos = 4.2, mlab="Summary Estimate", alim=c(0,5), xlim=c(-2,6),steps=3, cex=1)

%%html
Trying a multivariate model. This is not in their R code and Artur said not what they want to do. Included here for completeness.

dd_all = dd[ covariates + TE ]
dd_all = dd_all[~pd.isnull(dd_all).any(axis=1)]
cph = CoxPHFitter()
cph.fit(dd_all, 'T', event_col='E')
cph.print_summary()

%notebook forestplots.ipynb
