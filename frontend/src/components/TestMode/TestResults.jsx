import { useTestMode } from "../../context/TestModeContext";
import jsPDF from "jspdf";
import "../../styles/Results.scss";

const TestResults = () => {
  const { testResults } = useTestMode();

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const maxWidth = pageWidth - margin * 2;
    let y = 20;

    // Helper function to add text with word wrap
    const addWrappedText = (text, x, y, maxWidth) => {
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return y + lines.length * 7; // Return new Y position after text
    };

    // Add title
    doc.setFontSize(16);
    doc.text("Test Mode - IELTS Speaking Test Results", margin, margin);
    doc.setFontSize(12);

    Object.entries(testResults).forEach(([part, results]) => {
      // Check if we need a new page
      if (y > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        y = 20;
      }

      // Part header
      doc.setFont(undefined, "bold");
      y = addWrappedText(`${part.toUpperCase()}:`, margin, y, maxWidth);
      doc.setFont(undefined, "normal");
      y += 5;

      // Transcript
      doc.setFont(undefined, "bold");
      y = addWrappedText("Transcript:", margin, y, maxWidth);
      doc.setFont(undefined, "normal");
      y = addWrappedText(
        results?.result.transcript || "N/A",
        margin,
        y,
        maxWidth
      );
      y += 5;

      // Check for new page before scores
      if (y > doc.internal.pageSize.getHeight() - 60) {
        doc.addPage();
        y = 20;
      }

      // Scores
      doc.setFont(undefined, "bold");
      y = addWrappedText("Scores:", margin, y, maxWidth);
      doc.setFont(undefined, "normal");
      y += 5;

      const scores = [
        `Fluency: ${results?.result.scores.fluency || "N/A"}/9`,
        `Pronunciation: ${results?.result.scores.pronunciation || "N/A"}/9`,
        `Grammar: ${results?.result.scores.grammar || "N/A"}/9`,
        `Vocabulary: ${results?.result.scores.vocabulary || "N/A"}/9`,
        `Coherence: ${results?.result.scores.coherence || "N/A"}/9`,
        `Overall: ${results?.result.scores.overall || "N/A"}/9`,
      ];

      scores.forEach((score) => {
        y = addWrappedText(score, margin, y, maxWidth);
      });
      y += 5;

      // Check for new page before feedback
      if (y > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        y = 20;
      }

      // Feedback
      doc.setFont(undefined, "bold");
      y = addWrappedText("Feedback:", margin, y, maxWidth);
      doc.setFont(undefined, "normal");
      y = addWrappedText(
        results?.result.feedback || "N/A",
        margin,
        y,
        maxWidth
      );
      y += 15;
    });

    doc.save("IELTS Speaking Test Results.pdf");
  };

  return (
    <div className="results-container">
      <h2>Test Results Summary</h2>
      {Object.entries(testResults).map(([part, results]) => (
        <div key={part} className="part-results">
          {/* First check if user's response is relevant to the topic. */}
          {results?.result.relevance !== "TRUE" ? (
            <div className="error-message">
              Your answer is not relevant to the question. Please answer
              appropriately!
            </div>
          ) : (
            <>
              <h3>{part.toUpperCase()}</h3>
              <div className="transcript">
                <h4>Transcript:</h4>
                <p>{results?.result.transcript || "N/A"}</p>
              </div>

              <div className="scores">
                <div className="score-item">
                  <span className="score-label">Fluency:</span>
                  <span className="score-value">
                    {results?.result.scores.fluency || "N/A"}/9
                  </span>
                </div>
                <div className="score-item">
                  <span className="score-label">Pronunciation:</span>
                  <span className="score-value">
                    {results?.result.scores.pronunciation || "N/A"}/9
                  </span>
                </div>
                <div className="score-item">
                  <span className="score-label">Grammar:</span>
                  <span className="score-value">
                    {results?.result.scores.grammar || "N/A"}/9
                  </span>
                </div>
                <div className="score-item">
                  <span className="score-label">Vocabulary:</span>
                  <span className="score-value">
                    {results?.result.scores.vocab || "N/A"}/9
                  </span>
                </div>
                <div className="score-item">
                  <span className="score-label">Coherence:</span>
                  <span className="score-value">
                    {results?.result.scores.coherence || "N/A"}/9
                  </span>
                </div>
                <div className="score-item">
                  <span className="score-label">Overall:</span>
                  <span className="score-value">
                    {results?.result.scores.overall || "N/A"}/9
                  </span>
                </div>
              </div>

              <div className="feedback">
                <h4>Feedback:</h4>
                <p>{results?.result.feedback || "N/A"}</p>
              </div>
            </>
          )}
        </div>
      ))}
      <button className="download-button" onClick={handleDownloadPDF}>
        Download PDF
      </button>
    </div>
  );
};

export default TestResults;
