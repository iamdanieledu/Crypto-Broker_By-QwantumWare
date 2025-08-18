document.addEventListener("DOMContentLoaded", function() {
  const breadcrumbItems = document.querySelectorAll('.breadcrumb-item a');
  breadcrumbItems.forEach(item => {
    if (item.href.includes('index.html')) {
      item.innerHTML = 'Home';
    }
  });
});