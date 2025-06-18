import { useState } from 'react';

export default function PhotoDeleter({ photoId }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState(null);

    const handleDelete = async () => {
        setIsDeleting(true);
        setError(null);

        try {
            const response = await fetch(`/api/upload_photo/${photoId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete photo');
            }

            alert('Photo deleted successfully');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    
    return (
        <div>
            <button onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete Photo'}
            </button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}


