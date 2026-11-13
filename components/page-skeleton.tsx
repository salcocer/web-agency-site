// Shown while a signed-in page loads its data.
export function PageSkeleton() {
  return (
    <div className="app-page" aria-busy="true" aria-label="Loading">
      <div className="page-head">
        <span className="skel" style={{ width: 120, height: 14 }} />
        <span className="skel" style={{ width: "min(420px, 80%)", height: 36 }} />
      </div>
      <div className="stats">
        <span className="skel" style={{ height: 76 }} />
        <span className="skel" style={{ height: 76 }} />
        <span className="skel" style={{ height: 76 }} />
      </div>
      <span className="skel" style={{ height: 220 }} />
    </div>
  );
}

export function NavSkeleton() {
  return (
    <div className="side-skel" aria-hidden="true">
      <span className="skel" style={{ height: 14, width: "70%" }} />
      <span className="skel" style={{ height: 14, width: "85%" }} />
      <span className="skel" style={{ height: 14, width: "60%" }} />
    </div>
  );
}
