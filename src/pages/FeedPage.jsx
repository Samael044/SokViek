import Feed from './Feed';

const PAGE_CONFIG = {
  job: {
    title: 'ປະກາດງານ',
    desc: 'ວຽກຈາກບໍລິສັດ ',
    empty: 'ຍັງບໍ່ມີວຽກທີ່ປະກາດ',
  },
  resume: {
    title: 'ພະນັກງານ',
    desc: 'Resume ຜູ້ຊອກວຽກ — ຮຽງຈາກຫຼ້າສຸດ',
    empty: 'ບໍ່ພົບ Resume',
  },
};

export default function FeedPage({ mode = 'job' }) {
  const config = PAGE_CONFIG[mode] || PAGE_CONFIG.job;
  return <Feed mode={mode} {...config} />;
}