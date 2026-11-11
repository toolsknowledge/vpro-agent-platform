
import { useEffect, useMemo, useState } from "react";
import "./EvaluationDashboard.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

const METRICS = [
  { key: "faithfulness", label: "Faithfulness" },
  { key: "context_precision", label: "Context Precision" },
  { key: "context_recall", label: "Context Recall" },
  { key: "answer_relevance", label: "Answer Relevance" },
  { key: "answer_correctness", label: "Answer Correctness" },
];

function formatScore(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "N/A";
  }
  return `${(value * 100).toFixed(1)}%`;
}

function scoreClass(value) {
  if (typeof value !== "number") return "score-neutral";
  if (value >= 0.9) return "score-good";
  if (value >= 0.7) return "score-medium";
  return "score-low";
}

export default function EvaluationDashboard() {
  const [report, setReport] = useState(null);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedIndex, setExpandedIndex] = useState(null);

  async function loadLatestReport() {
    setLoading(true);
    setError("");

    try {
      const [latestResponse, listResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/evaluation/latest`),
        fetch(`${API_BASE_URL}/api/evaluation/reports`),
      ]);

      if (!latestResponse.ok) {
        const body = await latestResponse.json().catch(() => ({}));
        throw new Error(
          body.detail || "Unable to load the latest evaluation report."
        );
      }

      const latestData = await latestResponse.json();

      const listData = listResponse.ok
        ? await listResponse.json()
        : { reports: [] };

      setReport(latestData.report);
      setReports(listData.reports || []);
      setSelectedReport(latestData.report.report_name || "");
      setExpandedIndex(null);
    } catch (err) {
      setError(err.message || "Unable to load evaluation reports.");
    } finally {
      setLoading(false);
    }
  }

  async function loadSelectedReport(reportName) {
    if (!reportName) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/evaluation/reports/${encodeURIComponent(
          reportName
        )}`
      );

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          body.detail || "Unable to load the selected report."
        );
      }

      setReport(body.report);
      setSelectedReport(reportName);
      setExpandedIndex(null);
    } catch (err) {
      setError(err.message || "Unable to load the selected report.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLatestReport();
  }, []);

  const scores = report?.average_ragas_scores || {};
  const results = report?.results || [];

  const summary = useMemo(() => {
    const successful =
      report?.successful_records ??
      results.filter((item) => item.status === "success").length;

    const failed =
      report?.failed_records ??
      results.filter((item) => item.status !== "success").length;

    return {
      total: report?.total_records ?? results.length,
      successful,
      failed,
    };
  }, [report, results]);

  if (loading && !report) {
    return (
      <div className="evaluation-state">
        Loading RAG evaluation dashboard...
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="evaluation-dashboard">
        <div className="evaluation-error">{error}</div>
        <button
          className="evaluation-button"
          onClick={loadLatestReport}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <section className="evaluation-dashboard">
      <div className="evaluation-header">
        <div>
          <p className="evaluation-eyebrow">
            VPRO SKILLS EDUTECH
          </p>

          <h2>RAG Evaluation Dashboard</h2>

          <p className="evaluation-subtitle">
            Monitor retrieval quality, answer quality, and test results.
          </p>
        </div>

        <button
          className="evaluation-button"
          onClick={loadLatestReport}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="evaluation-error">{error}</div>
      )}

      <div className="evaluation-toolbar">
        <label htmlFor="evaluation-report-select">
          Evaluation report
        </label>

        <select
          id="evaluation-report-select"
          value={selectedReport}
          onChange={(event) =>
            loadSelectedReport(event.target.value)
          }
          disabled={!reports.length || loading}
        >
          {reports.map((item) => (
            <option
              key={item.report_name}
              value={item.report_name}
            >
              {item.report_name}
            </option>
          ))}
        </select>
      </div>

      <div className="evaluation-meta">
        <span>
          <strong>Evaluated:</strong>{" "}
          {report?.evaluation_date
            ? new Date(report.evaluation_date).toLocaleString()
            : "Not available"}
        </span>

        <span>
          <strong>Type:</strong>{" "}
          {report?.evaluation_type || "Not specified"}
        </span>
      </div>

      <div className="evaluation-summary-grid">
        <div className="evaluation-summary-card">
          <span>Total questions</span>
          <strong>{summary.total}</strong>
        </div>

        <div className="evaluation-summary-card">
          <span>Successful</span>
          <strong className="text-success">
            {summary.successful}
          </strong>
        </div>

        <div className="evaluation-summary-card">
          <span>Failed</span>
          <strong
            className={
              summary.failed ? "text-danger" : "text-success"
            }
          >
            {summary.failed}
          </strong>
        </div>
      </div>

      <h3 className="evaluation-section-title">
        Average RAGAS Metrics
      </h3>

      <div className="evaluation-metric-grid">
        {METRICS.map((metric) => {
          const value = scores[metric.key];

          return (
            <div
              className="evaluation-metric-card"
              key={metric.key}
            >
              <span>{metric.label}</span>

              <strong className={scoreClass(value)}>
                {formatScore(value)}
              </strong>

              <div className="evaluation-progress-track">
                <div
                  className={`evaluation-progress-fill ${scoreClass(
                    value
                  )}`}
                  style={{
                    width: `${
                      typeof value === "number"
                        ? Math.max(
                            0,
                            Math.min(100, value * 100)
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <h3 className="evaluation-section-title">
        Question-Level Results
      </h3>

      {!results.length ? (
        <p className="evaluation-empty">
          No question-level results in this report.
        </p>
      ) : (
        <div className="evaluation-results">
          {results.map((item, index) => {
            const metricScores = item.ragas_metrics || {};
            const isExpanded = expandedIndex === index;

            return (
              <article
                className="evaluation-result-card"
                key={`${item.question}-${index}`}
              >
                <button
                  className="evaluation-result-toggle"
                  onClick={() =>
                    setExpandedIndex(
                      isExpanded ? null : index
                    )
                  }
                  aria-expanded={isExpanded}
                >
                  <span className="evaluation-result-number">
                    Q{index + 1}
                  </span>

                  <span className="evaluation-result-question">
                    {item.question || "Question not available"}
                  </span>

                  <span
                    className={
                      item.status === "success"
                        ? "evaluation-status status-success"
                        : "evaluation-status status-failed"
                    }
                  >
                    {item.status || "unknown"}
                  </span>

                  <span className="evaluation-chevron">
                    {isExpanded ? "−" : "+"}
                  </span>
                </button>

                {isExpanded && (
                  <div className="evaluation-result-details">
                    <div>
                      <h4>Generated Answer</h4>
                      <p>
                        {item.generated_answer ||
                          "No answer generated."}
                      </p>
                    </div>

                    <div>
                      <h4>Reference Answer</h4>
                      <p>
                        {item.reference_answer ||
                          "No reference answer."}
                      </p>
                    </div>

                    <div className="evaluation-inline-scores">
                      {METRICS.map((metric) => (
                        <span key={metric.key}>
                          {metric.label}:{" "}
                          <strong>
                            {formatScore(
                              metricScores[metric.key]
                            )}
                          </strong>
                        </span>
                      ))}
                    </div>

                    {item.error && (
                      <div className="evaluation-error">
                        <strong>Error:</strong> {item.error}
                      </div>
                    )}

                    {Array.isArray(item.retrieved_contexts) &&
                      item.retrieved_contexts.length > 0 && (
                        <details>
                          <summary>View Retrieved Context</summary>

                          {item.retrieved_contexts.map(
                            (context, contextIndex) => (
                              <pre key={contextIndex}>
                                {context}
                              </pre>
                            )
                          )}
                        </details>
                      )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
