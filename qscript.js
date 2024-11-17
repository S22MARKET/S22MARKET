document.getElementById('copyLinkButton').onclick = function () {
    const linkToCopy = 'https://s22market.github.io/S22MARKET/'; // تأكد من أن هذا هو الرابط الصحيح
    navigator.clipboard.writeText(linkToCopy).then(function() {
        alert('تم نسخ الرابط إلى الحافظة!');
    }, function(err) {
        alert('فشل في نسخ الرابط: ', err);
    });
};