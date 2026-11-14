'use client';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="section-wrap data-state data-state-error" role="alert"><strong>This route could not be rendered</strong><span>Live data was not replaced with a sample state</span><button className="button button-outline" type="button" onClick={() => reset()}>Try again</button></div>;
}
