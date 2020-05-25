interface Row {
  cell: string
  location: string
  lower: number
  lower_outliers: number
  max: number
  mean: number
  median: number
  min: number
  q1: number
  q3: number
  tumor: string
  upper: number
  upper_outliers: number
  group: string
}

// CD4, CD4_Treg, CD8 for BRCA and groups A, B
export const boxplot_data: Row[] = [
  {
    cell: 'CD4',
    location: 'STROMA',
    lower: 0,
    lower_outliers: 0,
    max: 2585.1,
    mean: 110.9,
    median: 9.6,
    min: 0,
    q1: 0,
    q3: 47.9,
    tumor: 'BRCA',
    upper: 98.0,
    upper_outliers: 13,
    group: 'A'
  },
  {
    cell: 'CD4',
    location: 'TUMOR',
    lower: 0,
    lower_outliers: 0,
    max: 2667.5,
    mean: 85.1,
    median: 6.6,
    min: 0,
    q1: 0.8,
    q3: 25.3,
    tumor: 'BRCA',
    upper: 58.5,
    upper_outliers: 13,
    group: 'A'
  },
  {
    cell: 'CD4_Treg',
    location: 'STROMA',
    lower: 0,
    lower_outliers: 0,
    max: 392.1,
    mean: 18.3,
    median: 0,
    min: 0,
    q1: 0,
    q3: 2.3,
    tumor: 'BRCA',
    upper: 4.8,
    upper_outliers: 16,
    group: 'A'
  },
  {
    cell: 'CD4_Treg',
    location: 'TUMOR',
    lower: 0.8,
    lower_outliers: 74,
    max: 31.4,
    mean: 0.7,
    median: 0,
    min: 0,
    q1: 0,
    q3: 0,
    tumor: 'BRCA',
    upper: 'NaN',
    upper_outliers: 0,
    group: 'A'
  },
  {
    cell: 'CD8',
    location: 'STROMA',
    lower: 0,
    lower_outliers: 0,
    max: 1027.3,
    mean: 201.4,
    median: 94.4,
    min: 0,
    q1: 32.7,
    q3: 222.1,
    tumor: 'BRCA',
    upper: 500.0,
    upper_outliers: 12,
    group: 'A'
  },
  {
    cell: 'CD8',
    location: 'TUMOR',
    lower: 0,
    lower_outliers: 0,
    max: 1721.8,
    mean: 303.5,
    median: 60.5,
    min: 0,
    q1: 17.3,
    q3: 275.2,
    tumor: 'BRCA',
    upper: 500.6,
    upper_outliers: 14,
    group: 'A'
  },
      {
    cell: 'CD4',
    location: 'STROMA',
    lower: 0,
    lower_outliers: 0,
    max: 2880.2,
    mean: 92.7,
    median: 15.4,
    min: 0,
    q1: 2.7,
    q3: 71.9,
    tumor: 'BRCA',
    upper: 165.4,
    upper_outliers: 61,
    group: 'B'
  },
  {
    cell: 'CD4',
    location: 'TUMOR',
    lower: 0,
    lower_outliers: 0,
    max: 2555.1,
    mean: 106.3,
    median: 12.5,
    min: 0,
    q1: 1.4,
    q3: 67.1,
    tumor: 'BRCA',
    upper: 162.0,
    upper_outliers: 59,
    group: 'B'
  },
  {
    cell: 'CD4_Treg',
    location: 'STROMA',
    lower: 0,
    lower_outliers: 0,
    max: 316.7,
    mean: 13.7,
    median: 0,
    min: 0,
    q1: 0,
    q3: 9.4,
    tumor: 'BRCA',
    upper: 23.6,
    upper_outliers: 70,
    group: 'B'
  },
  {
    cell: 'CD4_Treg',
    location: 'TUMOR',
    lower: 0.6,
    lower_outliers: 343,
    max: 36.2,
    mean: 0.5,
    median: 0,
    min: 0,
    q1: 0,
    q3: 0,
    tumor: 'BRCA',
    upper: 'NaN',
    upper_outliers: 0,
    group: 'B'
  },
  {
    cell: 'CD8',
    location: 'STROMA',
    lower: 0,
    lower_outliers: 0,
    max: 1769.5,
    mean: 175.6,
    median: 73.1,
    min: 0,
    q1: 18.8,
    q3: 199.7,
    tumor: 'BRCA',
    upper: 458.3,
    upper_outliers: 50,
    group: 'B'
  },
  {
    cell: 'CD8',
    location: 'TUMOR',
    lower: 0,
    lower_outliers: 0,
    max: 1825.7,
    mean: 269.3,
    median: 37.2,
    min: 0,
    q1: 10.5,
    q3: 201.9,
    tumor: 'BRCA',
    upper: 475.5,
    upper_outliers: 72,
    group: 'B'
  },
]
