import React from "react";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReload = () => {
        window.location.href = "/";
    };

    handleReset = () => {
        try {
            localStorage.clear();
        } catch {}
        window.location.href = "/";
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#0f172a",
                    color: "#f8fafc",
                    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
                    padding: "24px"
                }}>
                    <div style={{
                        maxWidth: "540px",
                        width: "100%",
                        background: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "16px",
                        padding: "36px",
                        textAlign: "center",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
                    }}>
                        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏍️</div>
                        <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#f8fafc", margin: "0 0 10px" }}>
                            Something Went Wrong
                        </h2>
                        <p style={{ fontSize: "14px", color: "#94a3b8", lineHeight: "1.6", margin: "0 0 24px" }}>
                            An unexpected issue occurred while rendering the page. You can refresh the page or reset the app session.
                        </p>

                        {this.state.error?.message && (
                            <div style={{
                                background: "#0f172a",
                                border: "1px solid #ef4444",
                                color: "#fca5a5",
                                padding: "12px 16px",
                                borderRadius: "8px",
                                fontSize: "13px",
                                textAlign: "left",
                                marginBottom: "24px",
                                fontFamily: "monospace",
                                wordBreak: "break-word"
                            }}>
                                {this.state.error.message}
                            </div>
                        )}

                        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                            <button
                                onClick={this.handleReload}
                                style={{
                                    padding: "10px 20px",
                                    background: "#2563eb",
                                    color: "#ffffff",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontWeight: "700",
                                    fontSize: "14px",
                                    cursor: "pointer"
                                }}
                            >
                                Reload MotoRent
                            </button>
                            <button
                                onClick={this.handleReset}
                                style={{
                                    padding: "10px 20px",
                                    background: "#334155",
                                    color: "#cbd5e1",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontWeight: "600",
                                    fontSize: "14px",
                                    cursor: "pointer"
                                }}
                            >
                                Clear Cache & Reset
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
