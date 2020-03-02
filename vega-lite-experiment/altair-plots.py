%%html
Experiments using altair, a library on top of vega-lite an abstraction over vega which generates d3 plots.
This is interesting because vega-lite is a javascript library. Sadly, this document is a bit of a post-mortem
because it turned out to not be expressive enough.

import altair as alt
import pandas as pd
db = pd.read_json('../frontend/db.json')[lambda row: row.tumor == 'lung']
db.head()

%%html
It is possible to generate expression bar plots by having location on the x axis and facetting on the cell
type (`alt.Column` below):

alt.Chart(db).mark_bar().encode(
    x=alt.X('location', axis=None),
    y=alt.Y('expression', axis=alt.Axis(grid=False)),
    column=alt.Column('cell', header=alt.Header(labelOrient='bottom'), spacing=10),
    color='location'
).configure_view(strokeWidth=0)

%%html
Without `strokeWidth` it is more apparent that these are several plots side-by-side:

alt.Chart(db).mark_bar().encode(
    x=alt.X('location', axis=None),
    y=alt.Y('expression', axis=alt.Axis(grid=False)),
    column=alt.Column('cell', header=alt.Header(labelOrient='bottom'), spacing=10),
    color='location'
)

%%html
I bumped in to many problems. This is problem 1: It is not possble to draw grid lines on the y-axis between graphs.
The corresponding issue is <a href="https://github.com/vega/vega-lite/issues/4703">vega-lite#4703</a>
This is what happens when the grid is turned on:

alt.Chart(db).mark_bar().encode(
    x=alt.X('location', axis=None),
    y=alt.Y('expression', axis=alt.Axis(grid=True)),
    column=alt.Column('cell', header=alt.Header(labelOrient='bottom'), spacing=10),
    color='location'
).configure_view(strokeWidth=0)

%%html
However we want to facet on both cell type and tumor cohort. This can be done by setting
the `column` to cell_full. However it will use the same padding between the cohorts (or cells, whichever
is put innermost). So this is problem 2.

%%html
On to problem 3: we want to have cell type as colour and stripedness for location. Color is possible in this way:

alt.Chart(db).mark_bar().encode(
    x=alt.X('location', axis=None),
    y=alt.Y('expression', axis=alt.Axis(grid=False)),
    column=alt.Column('cell', header=alt.Header(labelOrient='bottom'), spacing=10),
    color='cell'
).configure_view(strokeWidth=0)

%%html
For stripedness we have to include a bit of SVG for setting the fill. Then we are stuck since
it overrides the color property. (Note that this is not rendered in github because it requires svg)

from IPython.display import HTML
HTML('''<svg height=0>
<defs>
  <pattern id="stripe" patternUnits="userSpaceOnUse" width="6" height="6">
    <path d="M-1,1 l2,-2
       M0,6 l6,-6
       M5,7 l2,-2" stroke="black" stroke-width="2"></path>
  </pattern>
</defs>
</svg>''')

alt.Chart(db).mark_bar().encode(
    x=alt.X('location', axis=None),
    y=alt.Y('expression', axis=alt.Axis(grid=False)),
    column=alt.Column('cell', header=alt.Header(labelOrient='bottom'), spacing=10),
    color='cell', # this is ignored
    fill={
        'field': 'cell_full',
        'type': 'nominal',
        'scale': {'range': ['url(#stripe)', '']}
    },
).configure_view(
    strokeWidth=0
).display(renderer='svg')

%notebook altair-plots.ipynb
