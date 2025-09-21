document.addEventListener("DOMContentLoaded", () => {
    const members = document.querySelectorAll(".team-member");
    const modal = document.getElementById("modal");
    const closeBtn = document.getElementById("closeBtn");
  
    const modalName = document.getElementById("modal-name");
    const modalRole = document.getElementById("modal-role");
    const modalDescription = document.getElementById("modal-description");
  
    members.forEach(member => {
      member.addEventListener("click", () => {
        const name = member.dataset.name;
        const role = member.dataset.role;
        const description = member.dataset.description;
  
        modalName.textContent = name;
        modalRole.textContent = role;
        modalDescription.textContent = description;
  
        modal.style.display = "block";
      });
    });
  
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  
    window.addEventListener("click", (e) => {
      if (e.target == modal) {
        modal.style.display = "none";
      }
    });
  });
  