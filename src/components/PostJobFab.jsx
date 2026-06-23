import { Link } from 'react-router-dom';

export default function PostJobFab({ onClick, to, state }) {
  const className = 'fab-post-job';

  if (to) {
    return (
      <Link to={to} state={state} className={className}>
        + ປະກາດງານໃໝ່
      </Link>
    );
  }

  return (
    <button type="button" className={className} onClick={onClick}>
      + ປະກາດງານໃໝ່
    </button>
  );
}
