import React from 'react';
import { useState } from 'react';
import './App.css'; // تأكد من إضافة تنسيقات CSS هنا

const App = () => {
    const [linkCopied, setLinkCopied] = useState(false);
    const qrCodeUrl = "path/to/your/qrcode.png"; // استبدل بمسار QR Code
    const apkLink = "path/to/your/app.apk"; // استبدل برابط APK
    const linkToCopy = "https://example.com"; // استبدل بالرابط الذي تريد نسخه

    const copyLink = () => {
        navigator.clipboard.writeText(linkToCopy)
            .then(() => {
                setLinkCopied(true);
                setTimeout(() => {
                    setLinkCopied(false);
                }, 2000);
            })
            .catch(err => console.error('فشل في نسخ الرابط: ', err));
    };

    return (
        <div className="app-container">
            <h2>تحميل تطبيقنا</h2>
            <div className="qr-code">
                <img src={qrCodeUrl} alt="QR Code" />
            </div>
            <a href={apkLink} className="button" download>تحميل التطبيق (APK)</a>
            <button className="button" onClick={copyLink}>نسخ الرابط</button>
            {linkCopied && <p className="copy-notification">تم نسخ الرابط إلى الحافظة!</p>}
            <div className="footer">
                <p>لأي استفسارات، يرجى الاتصال بنا.</p>
            </div>
        </div>
    );
};

export default App;