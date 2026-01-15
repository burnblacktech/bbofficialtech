// Stub - EmptyState
const EmptyState = ({ title, description, children }) => (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h3>{title}</h3>
        <p>{description}</p>
        {children}
    </div>
);

export default EmptyState;
