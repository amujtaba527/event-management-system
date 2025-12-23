'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Upload, Loader2 } from 'lucide-react';
import { uploadAttendees } from '../../app/admin/actions'; // Adjust path as needed
import { useRouter } from 'next/navigation';

export default function CsvUploader({ eventId }: { eventId: number }) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            await uploadAttendees(eventId, formData);
            router.refresh(); // Refresh server data
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Upload failed. Please check the file format.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".csv"
                onChange={handleFileChange}
            />
            <Button
                onClick={() => fileInputRef.current?.click()}
                variant="secondary"
                size="sm"
                isLoading={uploading}
            >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Importing...' : 'Import CSV'}
            </Button>
        </div>
    );
}
