// Loading, empty, error and rate-limited in one place. These are needed by the results
// grid, both detail pages and the description panel - pre-production.md item 21 calls them
// out because a wiki with a search box has all of them constantly. Four separate
// <div>Loading</div>s is also how role="status" quietly goes missing.
export function StateBlock({ variant, title, detail, action }) {
  const live = variant === 'loading' ? { role: 'status', 'aria-live': 'polite' } : {};
  const alert = variant === 'error' || variant === 'rateLimited' ? { role: 'alert' } : {};

  return (
    <div className="state" {...live} {...alert}>
      {title ? <p className="state__title">{title}</p> : null}
      {detail ? <p>{detail}</p> : null}
      {action ?? null}
    </div>
  );
}

// One place that decides how an ApiError reads, so a 429 never renders as "something went
// wrong" and never triggers a retry on its own. A retry against a 120/min bucket is how a
// search box turns into a retry storm; the button hands that decision to a person.
export function ErrorState({ error, onRetry }) {
  if (error?.status === 429) {
    const wait = error.retryAfterSeconds;
    return (
      <StateBlock
        variant="rateLimited"
        title="Too many requests"
        detail={wait
          ? `The wiki is rate limited. Try again in about ${wait} second${wait === 1 ? '' : 's'}.`
          : 'The wiki is rate limited. Wait a moment and try again.'}
        action={onRetry ? <p><button type="button" className="chip" onClick={onRetry}>Try again</button></p> : null}
      />
    );
  }

  if (error?.status === 404) {
    return <StateBlock variant="empty" title="Not found" detail={error.message} />;
  }

  return (
    <StateBlock
      variant="error"
      title="Could not load this"
      detail={error?.message ?? 'Something went wrong.'}
      action={onRetry ? <p><button type="button" className="chip" onClick={onRetry}>Try again</button></p> : null}
    />
  );
}
