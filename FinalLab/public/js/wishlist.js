// document.querySelectorAll('.add-to-wishlist').forEach(button => {
//     button.addEventListener('click', async (event) => {
//         const productId = event.target.getAttribute('data-product-id');

//         // Check if the user is logged in
//         const authResponse = await fetch('/user/check-auth', {
//             method: 'GET',
//             credentials: 'include' // Include cookies for session
//         });

//         if (authResponse.status === 401) {
//             // User is not logged in, redirect to login page
//             window.location.href = '/user/login';
//             return;
//         }

//         // User is logged in, proceed to add to wishlist
//         const addResponse = await fetch('/wishlist/add', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({ productId })
//         });

//         const data = await addResponse.json();
//         alert(data.message); // Show success or error message
//     });
// });
document.querySelectorAll('.add-to-wishlist').forEach(button => {
    button.addEventListener('click', async (event) => {
        const productId = event.target.getAttribute('data-product-id');
        console.log('Adding product ID:', productId);

        const authResponse = await fetch('/user/check-auth', { method: 'GET', credentials: 'include' });
        console.log('Auth response:', authResponse.status);

        if (authResponse.status === 401) {
            window.location.href = '/user/login';
            return;
        }

        const addResponse = await fetch('/wishlist/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId })
        });

        const data = await addResponse.json();
        console.log('Add to wishlist response:', data);
        alert(data.message);
    });
});
