
# require(xlsx)

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

dat <- NULL
# dat <- read.table("Made up immune data.txt", sep="\t", header=T, fill = T,dec = ",")
dat <- read.csv("./made-up-data.csv")
head(dat)

dat$status <-(dat$Event_last_followup)
dat$SurvObj <- with(dat, Surv(Time_Diagnosis_Last_followup, status == "Dead"))
# select tumor type, to analyse
dat2 <- dat[ which(
    dat$cohort == 'Rectum' &
    dat$PreOp_treatment_yesno == 'No'), ]
# dichotomise variables based on median
for(i in names(dat2[,c( 8:33)] )){
  x  <-  as.data.frame(dat2[!is.na(dat2[i]),])
  x[i] <- ntiles(x, dv = i, bins=2)
  f <- "PatID"
  dat2 <- merge( dat2,  x[,c(f,i)], by = f, all = T)
  }

############################################
############################################
###########################################
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
Cox

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

# Format pvalues so only those bellow 0.01 are scientifically notated
p.vals <- ifelse(p.vals < 0.001,
                 format(p.vals,digits = 3,scientific = TRUE,trim = TRUE),
                 format(round(p.vals, 3), nsmall=2, trim=TRUE))
p.vals <- gsub('e(.*)', ' x 10^\\1', p.vals)



# Plot combined data
options(repr.plot.width=10, repr.plot.height=7)
forest(res, transf=exp, refline=1, xlab="HR (95%CI)",
       slab=labs, ilab = p.vals, ilab.xpos = 4.2, mlab="Summary Estimate", alim=c(0,5), xlim=c(-2,6),steps=3, cex=1)

# ?forest
# ?metafor
# ?rma
# ?coxph
# ?ade4
