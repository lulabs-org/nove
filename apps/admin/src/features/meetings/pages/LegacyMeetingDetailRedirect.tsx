import { Navigate, useParams } from 'react-router-dom';

export function LegacyMeetingDetailRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/minutes?meetingId=${encodeURIComponent(id || '')}`} replace />;
}
