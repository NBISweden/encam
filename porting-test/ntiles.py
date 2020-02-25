'''
This script tests the port of the schoRsch ntiles function to python using pandas.
'''

from rpy2.robjects.packages import importr
import rpy2.robjects as ro
importr('schoRsch')
import numpy as np
import pandas as pd
from collections import Counter

R = lambda code: ro.r(code)
c = lambda *xs: ro.IntVector(xs)

# https://rdrr.io/cran/schoRsch/src/R/ntiles.R
ntiles_ported = lambda xs: pd.cut(pd.Series(xs).rank(), 2, right=False, labels=False) + 1

ntiles_R = R('function (a) ntiles(data.frame(a=a), dv=1, bins=2)')

tests = [
    [ a1, a2, a3, a4, a5 ]
    for a1 in range(8)
    for a2 in range(8) if a1 <= a2
    for a3 in range(8) if a2 <= a3
    for a4 in range(8) if a3 <= a4
    for a5 in range(8) if a4 <= a5
]

C = Counter()
for test in tests:
    res_R = np.array(ntiles_R(c(*test)), dtype=np.int64)
    res_ported = ntiles_ported(test)

    if not all(res_R == res_ported):
        C['bad'] += 1
        print(f'{test=}')
        print(f'{res_R}')
        print(f'{res_ported}')
        print()

    C['all'] += 1

print('Test results, this should not include any bad:')
print(C)

