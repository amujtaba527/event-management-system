'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CsvUploaderProps {
    action: (formData: FormData) => Promise<any>;
    buttonText?: string;
    onSuccess?: () => void;
}

export default function CsvUploader({ action, buttonText = "Import CSV", onSuccess }: CsvUploaderProps) {
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
            const res = await action(formData);
            if (res && res.success === false) {
                alert(res.message);
            } else {
                router.refresh();
                if (onSuccess) onSuccess();
                // If the action returned a message, maybe show it?
                if (res && res.message) alert(res.message);
            }

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
                {uploading ? 'Importing...' : buttonText}
            </Button>
        </div>
    );
}
