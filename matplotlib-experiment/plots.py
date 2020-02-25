import matplotlib.pyplot as plt

import numpy as np

from cycler import cycler

np.random.seed(19680801)
plt.rcdefaults()
plt.rcParams.update({
    'axes.prop_cycle': cycler(color=plt.cm.tab10_r.colors)
})
fig, (ax, bx) = plt.subplots(ncols=2, figsize=(12, 6), sharey=True)
# Example data
cells = ('CD4', 'CD4_Treg', 'CD8', 'CD8_Treg', 'iDC', 'pDC')
y_pos = np.arange(len(cells))
abundanceS = 3 + 10 * np.random.rand(len(cells))
abundanceT = 3 + 10 * np.random.rand(len(cells))
#
ax.invert_yaxis()  # labels read top-to-bottom
ax.barh(y_pos - 0.2, abundanceS, 0.4, align='center')
ax.barh(y_pos + 0.2, abundanceT, 0.4, align='center', hatch=4*'/', lw=0, edgecolor='white')
plt.rcParams.update({'hatch.linewidth': 2})
ax.set_yticks(y_pos)
ax.set_yticklabels(cells)
ax.set_xlabel('Abundance')
ax.set_title('A')
# Example data
# y_pos = np.arange(len(cells))
HR_S = 2 * np.random.rand(len(cells))
HRerr_S = np.random.rand(2, len(cells))
HR_T = 2 * np.random.rand(len(cells))
HRerr_T = np.random.rand(2, len(cells))
# error = np.random.rand(len(cells))
bx.errorbar(HR_S, y_pos - 0.1, xerr=HRerr_S, fmt='s')
bx.errorbar(HR_T, y_pos + 0.1, xerr=HRerr_T, fmt='s')
bx.set_yticks(y_pos)
bx.set_yticklabels(cells)
bx.set_xlabel('HR')
bx.set_title('B')
x1, y1 = [1, -0.5]
x2, y2 = [1, len(cells) - 0.5]
bx.plot([x1, x2], [y1, y2], color='gray')
bx.set_ylim([y1, y2])
plt.show()

