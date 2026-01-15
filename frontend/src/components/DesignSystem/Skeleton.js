// Stub - Skeleton component
export const Skeleton = ({ className = '', ...props }) => (
    <div className={`animate-pulse bg-neutral-200 rounded ${className}`} {...props} />
);

export default Skeleton;
