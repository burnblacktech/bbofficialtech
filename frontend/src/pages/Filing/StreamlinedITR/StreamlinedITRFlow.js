/**
 * Streamlined ITR Filing - Main Container
 * Orchestrates the 3-screen flow
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import IdentityVerificationScreen from './IdentityVerificationScreen';
import SingleScreenVerification from './SingleScreenVerification';
import FinalReviewSubmit from './FinalReviewSubmit';

const StreamlinedITRFlow = () => {
    const navigate = useNavigate();
    const [currentScreen, setCurrentScreen] = useState(1);
    const [aggregatedData, setAggregatedData] = useState(null);
    const [verifiedData, setVerifiedData] = useState(null);

    const handleIdentityComplete = (data) => {
        setAggregatedData(data);
        setCurrentScreen(2);
    };

    const handleVerificationComplete = (data) => {
        setVerifiedData(data);
        setCurrentScreen(3);
    };

    const handleSubmitSuccess = (filingId) => {
        // Navigate to e-verification or success page
        navigate(`/filing/${filingId}/e-verify`);
    };

    return (
        <>
            {currentScreen === 1 && (
                <IdentityVerificationScreen onNext={handleIdentityComplete} />
            )}

            {currentScreen === 2 && aggregatedData && (
                <SingleScreenVerification
                    aggregatedData={aggregatedData}
                    onBack={() => setCurrentScreen(1)}
                    onNext={handleVerificationComplete}
                />
            )}

            {currentScreen === 3 && verifiedData && (
                <FinalReviewSubmit
                    verifiedData={verifiedData}
                    onBack={() => setCurrentScreen(2)}
                    onSubmitSuccess={handleSubmitSuccess}
                />
            )}
        </>
    );
};

export default StreamlinedITRFlow;
