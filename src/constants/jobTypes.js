export const JOB_TYPES = {
  'full-time': 'ເຕັມເວລາ',
  'part-time': 'Part-time',
  contract: 'ສັນຍາຈ້າງ',
  remote: 'Remote',
};

export const JOB_TYPE_OPTIONS = Object.entries(JOB_TYPES).map(([value, label]) => ({
  value,
  label,
}));
