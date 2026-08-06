type Props = {
  kind: "loading" | "error";
  message?: string;
};

export default function StatusScreen({ kind, message }: Props) {
  return (
    <div className="status-screen" role={kind === "error" ? "alert" : "status"} aria-live="polite">
      <div className="status-screen-inner">
        {kind === "loading" ? (
          <>
            <span className="status-spinner" aria-hidden="true" />
            <p>Loading the recovery dataset…</p>
          </>
        ) : (
          <>
            <span className="status-icon" aria-hidden="true">!</span>
            <h2>The dataset could not be loaded</h2>
            <p>{message ?? "Something went wrong while fetching the data files."}</p>
            <button type="button" onClick={() => window.location.reload()}>
              Try again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
