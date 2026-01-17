// =====================================================
// GSTIN LOOKUP PAGE - GSTIN Admin Dashboard
// =====================================================

import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../../components/DesignSystem/DesignSystem';
import { lookupGSTIN } from '../../services/gstinService';
import './GSTINLookupPage.css';

const GSTINLookupPage = () => {
    const [gstin, setGstin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);

    const validateGSTIN = (value) => {
        // GSTIN format: 15 characters alphanumeric
        const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
        return gstinRegex.test(value.toUpperCase());
    };

    const handleInputChange = (e) => {
        const value = e.target.value.toUpperCase();
        setGstin(value);
        setError(null);
    };

    const handleLookup = async (e) => {
        e.preventDefault();

        // Validate GSTIN format
        if (!gstin) {
            setError('Please enter a GSTIN number');
            return;
        }

        if (!validateGSTIN(gstin)) {
            setError('Invalid GSTIN format. Expected format: 27AAACR5055K2Z6 (15 characters)');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await lookupGSTIN(gstin);
            setResult(response);
        } catch (err) {
            setError(err.message || 'Failed to lookup GSTIN');
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setGstin('');
        setError(null);
        setResult(null);
    };

    const renderResult = () => {
        if (!result) return null;

        const { data } = result;

        // Handle error response
        if (data?.success === false) {
            return (
                <div className="gstin-result">
                    <div className="result-header">
                        <h3>GSTIN Details</h3>
                        <span className="result-timestamp">
                            Retrieved: {new Date(result.timestamp).toLocaleString()}
                        </span>
                    </div>
                    <div className="result-error">
                        <p>{data?.message || 'GSTIN not found or invalid'}</p>
                    </div>
                </div>
            );
        }

        // Extract company data from the API response
        const companyData = data?.data || {};

        // Helper function to format field names
        const formatFieldName = (key) => {
            return key
                .replace(/_/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        };

        // Helper function to render value based on type
        const renderValue = (value) => {
            if (value === null || value === undefined || value === '') {
                return <span className="empty-value">-</span>;
            }
            if (typeof value === 'boolean') {
                return value ? 'Yes' : 'No';
            }
            if (typeof value === 'object' && !Array.isArray(value)) {
                return (
                    <div className="nested-object">
                        {Object.entries(value).map(([k, v]) => (
                            <div key={k} className="nested-item">
                                <strong>{formatFieldName(k)}:</strong> {renderValue(v)}
                            </div>
                        ))}
                    </div>
                );
            }
            if (Array.isArray(value)) {
                return (
                    <ul className="array-list">
                        {value.map((item, idx) => (
                            <li key={idx}>{typeof item === 'object' ? JSON.stringify(item) : String(item)}</li>
                        ))}
                    </ul>
                );
            }
            return String(value);
        };

        return (
            <div className="gstin-result">
                <div className="result-header">
                    <div>
                        <h3>🏢 Company Details</h3>
                        {result.source === 'CACHE' && (
                            <div className="cache-badge">
                                <span className="badge badge-cache">📦 From Cache</span>
                                <span className="cache-info">
                                    Looked up {result.lookupCount} time{result.lookupCount !== 1 ? 's' : ''}
                                </span>
                            </div>
                        )}
                        {result.source === 'SUREPASS_API' && (
                            <span className="badge badge-api">🌐 Fresh from API</span>
                        )}
                    </div>
                    <span className="result-timestamp">
                        Retrieved: {new Date(result.timestamp).toLocaleString()}
                    </span>
                </div>

                <div className="result-content">
                    {/* Main Company Information Table */}
                    <div className="result-section">
                        <h4>📋 Basic Information</h4>
                        <table className="data-table">
                            <tbody>
                                {Object.entries(companyData).map(([key, value]) => (
                                    <tr key={key}>
                                        <td className="table-label">{formatFieldName(key)}</td>
                                        <td className="table-value">{renderValue(value)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Raw JSON Response (Collapsible) */}
                    <details className="raw-response-section">
                        <summary className="raw-response-toggle">
                            <span>🔍 View Raw API Response</span>
                        </summary>
                        <pre className="json-display">
                            {JSON.stringify(data, null, 2)}
                        </pre>
                    </details>
                </div>
            </div>
        );
    };

    return (
        <div className="gstin-lookup-page">
            <div className="page-container">
                <div className="page-header">
                    <h1>🏢 GSTIN Lookup</h1>
                    <p className="page-subtitle">
                        Fetch company details using GSTIN number from SurePass API
                    </p>
                </div>

                <Card className="lookup-card">
                    <CardHeader>
                        <h2>Enter GSTIN Number</h2>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLookup} className="lookup-form">
                            <div className="form-group">
                                <label htmlFor="gstin-input">GSTIN Number</label>
                                <input
                                    id="gstin-input"
                                    type="text"
                                    value={gstin}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 27AAACR5055K2Z6"
                                    maxLength={15}
                                    className={`gstin-input ${error ? 'error' : ''}`}
                                    disabled={loading}
                                />
                                <span className="input-hint">
                                    15 characters (2 digits + 10 alphanumeric + 3 characters)
                                </span>
                            </div>

                            {error && (
                                <div className="error-message">
                                    <span className="error-icon">⚠️</span>
                                    {error}
                                </div>
                            )}

                            <div className="button-group">
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading || !gstin}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner"></span>
                                            Fetching Details...
                                        </>
                                    ) : (
                                        <>
                                            <span className="btn-icon">🔍</span>
                                            Fetch Details
                                        </>
                                    )}
                                </button>

                                {(result || error) && (
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={handleClear}
                                        disabled={loading}
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {renderResult()}
            </div>
        </div>
    );
};

export default GSTINLookupPage;
