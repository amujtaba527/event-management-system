'use client';

import { Button } from '@/components/ui/Button';
import { FileText } from 'lucide-react';

export default function DownloadSampleCsv() {
    const handleDownload = () => {
        const csvContent = "Student ID,Name,Class\n2023-CS-001,John Doe,BSCS-2A\n2023-CS-002,Jane Smith,BSCS-2A";
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', 'attendees_sample.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Button variant="outline" size="sm" onClick={handleDownload} type="button">
            <FileText className="w-4 h-4 mr-2" />
            Sample CSV
        </Button>
    );
}
