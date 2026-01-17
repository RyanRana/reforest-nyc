// Inject logo into healthcare dashboard header
(function() {
  // Wait for DOM to be ready
  function addLogo() {
    const header = document.querySelector('.min-h-screen > div:first-child .container');
    
    if (header && !document.querySelector('.healthcare-logo')) {
      const logo = document.createElement('img');
      logo.src = '/logo.png';
      logo.alt = 'ReforestNYC';
      logo.className = 'healthcare-logo';
      logo.style.height = '50px';
      logo.style.width = 'auto';
      logo.style.marginBottom = '1rem';
      logo.style.display = 'block';
      logo.style.objectFit = 'contain';
      
      const firstChild = header.querySelector('h1') || header.firstChild;
      if (firstChild) {
        header.insertBefore(logo, firstChild);
      } else {
        header.appendChild(logo);
      }
    }
  }

  // Try multiple times to ensure it loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addLogo);
  } else {
    addLogo();
  }
  
  // Also try after a short delay
  setTimeout(addLogo, 100);
  setTimeout(addLogo, 500);
  setTimeout(addLogo, 1000);
})();
