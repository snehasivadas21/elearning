import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download } from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import { extractResults } from "../../api/api";

export default function CertificatePage() {
  const [certificates, setCertificates] = useState([]);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const res = await axiosInstance.get("/certificate/");
        setCertificates(extractResults(res));
      } catch (err) {
        console.error("Error fetching certificates:", err);
      }
    };
    fetchCertificates();
  }, []);

  const handleDownload = async (certificateId) => {
    try {
      const res = await axiosInstance.get(`/certificate/${certificateId}/download/`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `certificate_${certificateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-purple-600">My Certificates</h1>
      {certificates.length === 0 ? (
        <p className="text-gray-500">No certificates available yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <Card key={cert.certificate_id} className="shadow-lg rounded-2xl">
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold">{cert.course.title}</h2>
                <p className="text-sm text-gray-600">
                  Issued: {new Date(cert.issued_at).toLocaleDateString()}
                </p>
                <Button
                  className="mt-4 flex items-center gap-2"
                  onClick={() => handleDownload(cert.certificate_id)}
                >
                  <Download size={16} /> Download
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
