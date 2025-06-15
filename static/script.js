// Doctor list container scroll horizontal
window.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".doctor-container");
  if (container) {
    container.style.flexWrap = "nowrap";
    container.style.overflowX = "auto";
  }
});

// Book Appointment
document.getElementById("appointment-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const name = document.getElementById("client-name").value;
  const doctorSelect = document.getElementById("doctor-select");
  const doctor = doctorSelect.options[doctorSelect.selectedIndex].text;
  const time = document.getElementById("appointment-time").value;

  fetch("/submit_appointment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, time, doctor: doctorSelect.value })
  })
    .then(res => res.json())
    .then(data => {
      const confirmation = document.getElementById("confirmation");
      if (data.status === "success") {
        confirmation.innerText = `✅ Appointment booked successfully with ${doctor}`;
        confirmation.style.color = "green";
        confirmation.style.display = "block";
        this.reset();
      } else {
        confirmation.innerText = "❌ Failed to book appointment.";
        confirmation.style.color = "red";
        confirmation.style.display = "block";
      }
    })
    .catch(() => {
      const confirmation = document.getElementById("confirmation");
      confirmation.innerText = "❌ Server error. Try again.";
      confirmation.style.color = "red";
    });
});

// Upload Report
document.getElementById("report-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const formData = new FormData(this);
  const status = document.getElementById("report-status");
  const submitButton = this.querySelector('button[type="submit"]');
  
  // Show loading state
  status.innerText = "⏳ Uploading report...";
  status.style.color = "#0066cc";
  submitButton.disabled = true;
  submitButton.style.opacity = "0.7";

  fetch("/upload_report", {
    method: "POST",
    body: formData
  })
    .then(res => {
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return res.text();
    })
    .then(msg => {
      if (msg.includes("Uploaded")) {
        status.innerText = "✅ Report uploaded successfully!";
        status.style.color = "#00cc99";
        this.reset();
      } else {
        throw new Error(msg || 'Upload failed');
      }
    })
    .catch(error => {
      console.error('Upload error:', error);
      status.innerText = "❌ Upload failed. Please try again.";
      status.style.color = "#ff4444";
    })
    .finally(() => {
      // Reset button state
      submitButton.disabled = false;
      submitButton.style.opacity = "1";
    });
});

// Download Report
document.getElementById("download-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const clientName = document.getElementById("download-client-name").value;
  const status = document.getElementById("download-status");
  const submitButton = this.querySelector('button[type="submit"]');

  // Show loading state
  status.innerText = "⏳ Preparing download...";
  status.style.color = "#0066cc";
  submitButton.disabled = true;
  submitButton.style.opacity = "0.7";

  fetch(`/download/${clientName}`)
    .then(res => {
      if (res.ok) {
        return res.blob();
      }
      return res.text().then(text => {
        throw new Error(text || 'Download failed');
      });
    })
    .then(blob => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `report_${clientName}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      status.innerText = "✅ Report downloaded successfully!";
      status.style.color = "#00cc99";
      this.reset();
    })
    .catch(error => {
      console.error('Download error:', error);
      status.innerText = error.message || "❌ Download failed. Please try again.";
      status.style.color = "#ff4444";
    })
    .finally(() => {
      submitButton.disabled = false;
      submitButton.style.opacity = "1";
    });
});
