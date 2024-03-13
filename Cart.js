// Display Cart Function
function displayCart(userId) {
  const cartList = document.getElementById('cart-list');
  const totalPriceDiv = document.getElementById('total-price');
  const itemCountSpan = document.getElementById('item-count');
  const loadingMessage = document.getElementById('loading-message');
  const notLoggedInMessage = document.getElementById('not-logged-in-message');
  const emptyCartMessage = document.getElementById('empty-cart-message');

  // Show loading message
  loadingMessage.innerHTML = 'Loading...';
  loadingMessage.style.display = 'block';

  // Clear existing cart content
  while (cartList.firstChild) {
    cartList.removeChild(cartList.firstChild);
  }

  if (userId) {
    // Retrieve the cart data from the database
    const cartRef = database.ref(`users/${userId}/cart`);
    cartRef.once('value', (snapshot) => {
      const cart = snapshot.val();

      // Hide loading message
      loadingMessage.style.display = 'none';

      if (cart) {
        // Display the cart content
        if (notLoggedInMessage) {
          notLoggedInMessage.style.display = 'none';
        }

        const uniqueProducts = new Set(); // Track unique product keys

        Object.keys(cart).forEach((key) => {
          const item = cart[key];
          const listItem = document.createElement('div');
          listItem.classList.add('item-post', 'd-sm-flex', 'mb-3');
          listItem.innerHTML = `
            <div class="item-thumbnail me-3 popular-img" style="width:200px">
              <a class="rounded-2 jt-bg-light overflow-hidden shadow-sm d-block ratio ratio-16x9 mb-2" href="${item.link}" target="_blank">
                <span class="text-center post-cap h-inherit">No Image</span><img src="${item.imageSrc}" alt="Image">
              </a>
            </div>

            <div class="item-content col overflow-hidden">
              <h2 class="item-title fs-5 mb-2 p-0"><a class="text-reset" href="${item.link}" target="_blank">${item.title}</a></h2>
              <p class='mb-2'>Post ID: ${item.postId}</p>
              <p class='fw-bold link mb-2 fs-7'>Price: ${item.price}</p>
              <div class='mb-2'>
                <button class='btn btn-sm' onclick="decreaseQuantity(this)" data-cart-item-id='${key}'>-</button>
                <input class='quantity-input btn btn-sm' id='quantity2' type="number" value="${item.quantity}" min="1" onchange="updateQuantity('${key}', this)">
                <button class='btn btn-sm' onclick="increaseQuantity(this)" data-cart-item-id='${key}'>+</button>
              </div>
              <button class='btn' onclick="removeFromCart('${key}', '${item.price}')">Remove from Cart</button>
            </div><br>
          `;
          cartList.appendChild(listItem);

          uniqueProducts.add(key); // Add product key to the set
        });

        // Calculate total price and unique item count
        let totalPrice = 0;
        const uniqueItemCount = uniqueProducts.size;

        Object.keys(cart).forEach((key) => {
          const item = cart[key];
          totalPrice += parseFloat(item.price.replace('$', '')) * item.quantity;
        });

        // Display total price and unique item count
        totalPriceDiv.textContent = `Total Price: $${totalPrice.toFixed(2)}`;
        itemCountSpan.textContent = uniqueItemCount;

        // Hide or show the empty cart message based on the cart content
        if (emptyCartMessage) {
          
        }
      } else {
        // Display a message if the cart is empty
        totalPriceDiv.textContent = 'Total Price: $0.00';
        itemCountSpan.textContent = '0';
        if (emptyCartMessage) {
          emptyCartMessage.style.display = 'block';
        }
      }
    });
  } else {
    // Clear the cart display if the user is not logged in
    totalPriceDiv.textContent = 'Total Price: $0.00';
    itemCountSpan.textContent = '0';
    // Hide loading message
    loadingMessage.style.display = 'none';

    // Display the "not logged in" message if the element exists
    if (notLoggedInMessage) {
      notLoggedInMessage.style.display = 'block';
      emptyCartMessage.style.display = 'none';
    }
  }
}
// Remove from Cart Function
function removeFromCart(cartItemId, itemPrice) {
  const userId = auth.currentUser?.uid;
  const cartRef = database.ref(`users/${userId}/cart/${cartItemId}`);
  const userRef = database.ref(`users/${userId}`);

  cartRef.once('value')
    .then((snapshot) => {
      const cartItem = snapshot.val();

      if (!cartItem) {
        // Handle the case where the item is not found in the cart
        throw new Error('Item not found in the cart.');
      }

      // Remove the item from the cart
      return cartRef.remove().then(() => cartItem);
    })
    .then((cartItem) => {
      // Update the total price for the user
      return userRef.once('value').then((userSnapshot) => {
        const userData = userSnapshot.val();
        const itemTotalPrice = parseFloat(itemPrice.replace('$', '')) * cartItem.quantity;
        return userRef.update({
          totalPrice: userData.totalPrice - itemTotalPrice
        });
      });
    })
    .then(() => {
      // Display the updated cart contents and total price
      displayCart(userId);

      // Provide feedback to the user
      alert('Product removed from the cart.');

    })
    .catch((error) => {
      // Handle errors (e.g., item not found, database error)
      console.error(`Error removing item from cart: ${error.message}`);
      // Provide feedback to the user
      alert('Error removing product from the cart. Please try again.');
    });
}


// Clear Cart Function
function clearCart() {
  const userId = auth.currentUser?.uid;
  if (userId) {
    const cartRef = database.ref(`users/${userId}/cart`);

  
    cartRef.remove()
      .then(() => {
        // Clear the total price for the user
        const userRef = database.ref(`users/${userId}`);
        return userRef.update({
          totalPrice: 0
        });
      })
      .then(() => {
        // Display an empty cart and reset total price
        displayCart(userId);

        // Provide feedback to the user
        alert('Cart cleared successfully.');

       
      })
      .catch((error) => {
        console.error(`Clear Cart error: ${error.message}`);
        // Provide feedback to the user in case of an error
        alert('Error clearing the cart. Please try again.');
      });
  }
}




// Checkout Function
function checkout() {
  const userId = auth.currentUser?.uid;

  if (userId) {
    const cartRef = database.ref(`users/${userId}/cart`);
    const userRef = database.ref(`users/${userId}`);

    // Retrieve the cart data from the database
    cartRef.once('value')
      .then((snapshot) => {
        const cart = snapshot.val();

        if (cart) {
          // Process each item in the cart (e.g., update inventory, create order, etc.)
          // For simplicity, let's just display the details of each item in the console
          Object.keys(cart).forEach((key) => {
            const item = cart[key];
            console.log(`Processing item: ${item.title}, Quantity: ${item.quantity}`);
            // You may perform additional actions here based on your checkout logic
          });

          // Clear the user's cart after successful checkout
          cartRef.remove();

          // Optionally, update other user-related data or perform additional actions

          // Display a success message to the user
          alert('Checkout successful! Thank you for your purchase.');

          // Update the cart display
          displayCart(userId);
        } else {
          // Cart is empty, display a message to the user
          alert('Your cart is empty. Add items to your cart before checking out.');
        }
      })
      .catch((error) => {
        console.error(`Error during checkout: ${error.message}`);
        // Display an error message to the user
        alert('An error occurred during checkout. Please try again.');
      });
  } else {
    // User is not logged in, prompt them to log in
    alert('You are not logged in. Please log in to proceed with checkout.');
  }
}

// Clear Cart Function
function clearCart() {
  const userId = auth.currentUser?.uid;
  if (userId) {
    const cartRef = database.ref(`users/${userId}/cart`);

    cartRef.remove()
      .then(() => {
        // Clear the total price for the user
        const userRef = database.ref(`users/${userId}`);
        userRef.update({
          totalPrice: 0
        });

        // Display an empty cart and reset total price
        displayCart(userId);
      })
      .catch((error) => {
        alert(`Clear Cart error: ${error.message}`);
      });
  }
}


  // Display User Email Function
  function displayUserEmail(email, userId) {
    document.getElementById('user-status').innerHTML = `User Email: ${email} <br> (ID: ${userId}) <br> <button class='btn' onclick="logout()">Logout</button>`;
  }

