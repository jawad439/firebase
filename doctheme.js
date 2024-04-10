// Create a function to dynamically load scripts
function loadScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Load Firebase scripts
Promise.all([
    loadScript('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js'),
    loadScript('https://www.gstatic.com/firebasejs/9.6.1/firebase-database-compat.js'),
    loadScript('https://www.gstatic.com/firebasejs/9.6.1/firebase-auth-compat.js')
]).then(() => {
   

    const firebaseConfig = {
      apiKey: "AIzaSyAVuLENG_04wJBnZlX4HFjGyhM-_ThDiLQ",
  authDomain: "ecomerce-edition.firebaseapp.com",
  databaseURL: "https://ecomerce-edition-default-rtdb.firebaseio.com",
  projectId: "ecomerce-edition",
  storageBucket: "ecomerce-edition.appspot.com",
  messagingSenderId: "1019728704903",
  appId: "1:1019728704903:web:ada69624bd0633b3e30f22",
  measurementId: "G-JJXFZBDZDQ"
    };

   firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const database = firebase.database();



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
          emptyCartMessage.style.display = uniqueItemCount === 0 ? 'block' : 'none';
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

// Add to Cart Function
function addToCart(button) {
  const userId = auth.currentUser?.uid;

  if (!userId) {
    // Alert the user if not logged in
    alert('You are not logged in. Please login first to add products to your cart.');
    return;
  }

  // Disable the button to prevent multiple clicks during the process
  button.disabled = true;

  const cartRef = database.ref(`users/${userId}/cart`);
  const postElement = button.closest('.post');
  const postId = postElement.id;
  const quantity = postElement.querySelector('input[type="number"]').value;

  // Check if the post is already in the cart
  cartRef.once('value', (snapshot) => {
    const cart = snapshot.val();
    const isProductInCart = cart ? Object.values(cart).some((item) => item.postId === postId) : false;

    if (!isProductInCart) {
      // If the post is not in the cart, add it
      const newCartItem = cartRef.push();
      const imageSrc = postElement.querySelector('img')?.src || '';
      const title = postElement.querySelector('h2 a').textContent;
      const link = postElement.querySelector('h2 a').href;
      const price = postElement.querySelector('.price').textContent;

      newCartItem.set({
        postId: postId,
        imageSrc: imageSrc,
        title: title,
        link: link,
        price: price,
        quantity: quantity
      });

      // Update the total price for the user
      const userRef = database.ref(`users/${userId}`);
      userRef.once('value', (userSnapshot) => {
        const userData = userSnapshot.val();
        const userTotalPrice = userData ? userData.totalPrice || 0 : 0;
        const itemTotalPrice = parseFloat(price.replace('$', '')) * quantity;

        userRef.update({
          email: auth.currentUser.email,
          totalPrice: userTotalPrice + itemTotalPrice
        });

        // Display the updated cart contents and total price
        displayCart(userId);

        // Provide feedback to the user
        alert('Product added to the cart.');

        // Reset the button state after a delay (e.g., 2 seconds)
        setTimeout(() => {
          button.disabled = false;
        }, 2000);
      });
    } else {
      // Product is already in the cart
      alert('Product is already in the cart.');
      button.disabled = false; // Reset the button state
    }
  });
}
















 // New function to decrease quantity
function decreaseQuantity(element) {
  const input = element.nextElementSibling;
  const cartItemId = input.getAttribute('data-cart-item-id');
  const currentValue = parseInt(input.value, 10);
  if (currentValue > 1) {
    input.value = currentValue - 1;
    updateQuantity(cartItemId, input);
  }
}

// New function to increase quantity
function increaseQuantity(element) {
  const input = element.previousElementSibling;
  const cartItemId = input.getAttribute('data-cart-item-id');
  const currentValue = parseInt(input.value, 10);
  input.value = currentValue + 1;
  updateQuantity(cartItemId, input);
}

// Updated function to handle both increase and decrease
function updateQuantity(cartItemId, input) {
  const userId = auth.currentUser.uid;
  const cartRef = database.ref(`users/${userId}/cart/${cartItemId}`);
  const userRef = database.ref(`users/${userId}`);
  const loadingMessage = document.getElementById('loading-message');

  // Show loading message
  loadingMessage.innerHTML = 'Updating quantity...';
  loadingMessage.style.display = 'block';

  // Retrieve the existing cart data from the database
  cartRef.once('value')
    .then((snapshot) => {
      const cartItem = snapshot.val();

      if (cartItem) {
        // Update the quantity value in the associated cart item
        const newQuantity = parseInt(input.value, 10);

        if (!isNaN(newQuantity) && newQuantity > 0) {
          const oldQuantity = cartItem.quantity;
          return cartRef.update({ quantity: newQuantity })
            .then(() => {
              // Update the total price for the user
              return userRef.once('value');
            })
            .then((userSnapshot) => {
              const userData = userSnapshot.val();
              const itemPrice = parseFloat(cartItem.price.replace('$', ''));
              const itemTotalPrice = itemPrice * newQuantity - itemPrice * oldQuantity;
              return userRef.update({
                totalPrice: userData.totalPrice + itemTotalPrice
              });
            })
            .then(() => {
              // Display the updated cart contents and total price
              displayCart(userId);

              // Provide feedback to the user
              alert('Quantity updated successfully.');
            })
            .catch((error) => {
              console.error(`Error updating quantity: ${error.message}`);
              // Provide feedback to the user in case of an error
              alert('Error updating quantity. Please try again.');
            })
            .finally(() => {
              // Hide loading message after the update operation
              loadingMessage.style.display = 'none';
            });
        } else {
          alert('Please enter a valid quantity.');
        }
      } else {
        // Hide loading message if the cart item doesn't exist
        loadingMessage.style.display = 'none';
      }
    })
    .catch((error) => {
      console.error(`Error fetching cart item data: ${error.message}`);
      // Provide feedback to the user in case of an error
      alert('Error fetching cart item data. Please try again.');
      // Hide loading message in case of an error
      loadingMessage.style.display = 'none';
    });
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


// Authentication Functions

function logout() {
  auth.signOut().then(() => {
    // Sign-out successful.
    alert('You have been successfully signed out.');
    document.getElementById('user-status').innerHTML = '';
    displayCart(); // Display an empty cart
  }).catch((error) => {
    // An error happened.
    console.error(`Logout error: ${error.message}`);
    alert('An error occurred during logout. Please try again.');
  });
}


// Function to switch between tabs
function openTab(tabName, button) {
  const tabs = document.getElementsByClassName("tab-content");
  for (let i = 0; i < tabs.length; i++) {
    tabs[i].style.display = "none";
  }

  const buttons = document.getElementsByClassName("tab");
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].classList.remove("active");
  }

  document.getElementById(tabName).style.display = "block";
  button.classList.add("active");
}

// Function to handle registration
function register() {
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (password.length < 6) {
    document.getElementById("registerError").textContent = "Password must be at least 6 characters.";
    return;
  }

  if (password !== confirmPassword) {
    document.getElementById("registerError").textContent = "Passwords do not match.";
    return;
  }

  // Proceed with registration without checking existing emails
  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      // Sign the user out after registration
      return auth.signOut().then(() => user);
    })
    .then((user) => {
      // Send verification email
      return user.sendEmailVerification();
    })
    .then(() => {
      alert(`User registered successfully. Verification email sent to ${email}.`);
    })
    .catch((error) => {
      document.getElementById("registerError").textContent = `Registration error: ${error.message}`;
    });
}


// Function to handle login
function login() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  const loginError = document.getElementById("loginError");

  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;

      if (user.emailVerified) {
        // Hide the login error message and show login successful message
        loginError.textContent = "Login successful!";
        loginError.style.color = "green";

        // Redirect or perform actions after successful login

        // Set a timeout to hide the success message after a few seconds
        setTimeout(() => {
          loginError.textContent = "";
        }, 3000);
      } else {
        auth.signOut(); // Sign the user out if email is not verified
        loginError.textContent = "Email not verified. Check your inbox to verify.";
      }
    })
    .catch((error) => {
      // Handle login errors
      loginError.textContent = `Login error: ${error.message}`;
    });
}



// Function to handle forgot password
function forgotPassword() {
  // Prompt for user's email address
  const email = prompt("Enter your email address:");

  // Check if the user entered an email
  if (email) {
    auth.sendPasswordResetEmail(email)
      .then(() => {
        // Inform the user about the password reset email
        alert(`Password reset email sent to ${email}. Check your inbox.`);

  })
      .catch((error) => {
        // Handle password reset errors
        alert(`Password reset error: ${error.message}`);
      });
  }
}

// Function to handle login with Google
function loginWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then((result) => {
      const user = result.user;
      alert(`User signed in with Google: ${user.email}`);
      // Reload the page after successful login
      location.reload();
    })
    .catch((error) => {
      document.getElementById("loginError").textContent = `Login error: ${error.message}`;
    });
}



// Display initial authentication status
auth.onAuthStateChanged((user) => {
  const userProfileDiv = document.getElementById('user-profile');
  const userProf = document.getElementById('user-prof');
  const notLoggedInMessage = document.getElementById('not-logged-in-message');
   const profileImageDiv = document.getElementById('google-profile-image');


  if (user) {
    // User is signed in
    displayUserEmail(user.email, user.uid);

    // Display user profile
    displayUserProfile(user);
     displayGoogleProfileImage();
    

    // Clear the cart display before displaying the updated cart
    displayCart(user.uid);

    // Hide the "not logged in" message if it exists
    if (notLoggedInMessage) {
      notLoggedInMessage.style.display = 'none';
    }
  } else {
    // User is signed out
    document.getElementById('user-status').innerHTML = '';

     if (profileImageDiv) {
      profileImageDiv.innerHTML = '<svg class="nav-icon jt-icon fs-5" viewBox="0 0 24 24" style="stroke-width: 1.4px; vertical-align: -.5em;"><path d="M20 20v-0a4 4 0 0 0-4-4H8a4 4 0 0 0-4 2v2"></path><circle cx="12" cy="9" r="4"></circle><circle cx="12" cy="12" r="11"></circle></svg>';
    }
    
    // Clear the cart display for the logged-out state
    displayCart();

    // Clear the user profile display
    userProfileDiv.innerHTML = "You are not logged in, please <a href='login.html'>login here</a>.";

    // Display the "not logged in" message if it exists
    if (notLoggedInMessage) {
      notLoggedInMessage.style.display = 'block';
    }
  }
});



// Function to display user Google profile image or a message
function displayGoogleProfileImage() {
  const user = auth.currentUser;
  const profileImageDiv = document.getElementById('google-profile-image');

  // Clear the content of the div
  profileImageDiv.innerHTML = '';

  // Check if the user is signed in
  if (user) {
    const googleProvider = new firebase.auth.GoogleAuthProvider();
    const googleUserInfo = user.providerData.find((userInfo) => userInfo.providerId === googleProvider.providerId);

    // Check if there is an updated profile image in the user object
    const updatedProfileImage = user.photoURL;

    if (googleUserInfo || updatedProfileImage) {
      // Create an img element
      const profileImage = document.createElement('img');
      profileImage.classList.add('rounded-2');

      // Set the source of the image based on availability
      profileImage.src = updatedProfileImage || (googleUserInfo ? googleUserInfo.photoURL : '');
      profileImage.alt = 'Google Profile Image';

      // Append the img element to the div
      profileImageDiv.appendChild(profileImage);
    } else {
      // User is signed in, but there is no Google profile image or updated profile image
      // Show a placeholder image
      profileImageDiv.innerHTML = '<svg class="nav-icon jt-icon fs-5" viewBox="0 0 24 24" style="stroke-width: 1.4px; vertical-align: -.5em;"><path d="M20 20v-0a4 4 0 0 0-4-4H8a4 4 0 0 0-4 2v2"></path><circle cx="12" cy="9" r="4"></circle><circle cx="12" cy="12" r="11"></circle></svg>';
    }
  } else {
    // User is signed out or not logged in
    // Show a message or a placeholder image
    profileImageDiv.innerHTML = '<svg class="nav-icon jt-icon fs-5" viewBox="0 0 24 24" style="stroke-width: 1.4px; vertical-align: -.5em;"><path d="M20 20v-0a4 4 0 0 0-4-4H8a4 4 0 0 0-4 2v2"></path><circle cx="12" cy="9" r="4"></circle><circle cx="12" cy="12" r="11"></circle></svg>';
  }
}


// Function to display user profile
function displayUserProfile(user) {
  const userProfileDiv = document.getElementById('user-profile');

  if (user) {
    // Fetch the user's data from the database
    const userId = user.uid;
    const userRef = database.ref(`users/${userId}/profile`);

    userRef.once('value')
      .then(snapshot => {
        const userProfileData = snapshot.val() || {};
        user.address = userProfileData.address !== undefined ? userProfileData.address : '';

        let userProfileHTML = '';

        // Display user information
        if (user.displayName && user.providerData.some((userInfo) => userInfo.providerId === 'google.com')) {
          // User is Google authenticated and has a display name
        } else {
          userProfileHTML += 'To Auto update your profile, please <a class="mt-4 mb-4" href="#" onclick="loginWithGoogle()">Login with Google</a><br>';
          
        }

        // Check if the user has a custom profile image URL
        if (user.photoURL) {
          userProfileHTML += `<img class="rounded mb-2" src="${user.photoURL}" alt="Profile Image"><br>`;
        } else {
          // If no custom image, show default Google profile image
          const googleProvider = new firebase.auth.GoogleAuthProvider();
          if (user.providerData.some((userInfo) => userInfo.providerId === googleProvider.providerId)) {
            const googleUserInfo = user.providerData.find((userInfo) => userInfo.providerId === googleProvider.providerId);
            userProfileHTML += `<img class="rounded mb-2" src="${googleUserInfo.photoURL}" alt="Profile Image"><br>`;
          }
        }

        // Display username or "Not provided"
        const displayedUsername = user.displayName || userProfileData.username || 'Not provided';
        userProfileHTML += `<strong>Name:</strong> ${displayedUsername}<br>`;
        userProfileHTML += `<strong>Email:</strong> ${user.email}<br>`;
        userProfileHTML += `<strong>Address:</strong> ${user.address || 'Not provided'}<br>`;

        // Display Edit Profile options
        userProfileHTML += '<div id="edit-profile-options">';
        userProfileHTML += '<button class="btn mt-3" onclick="editProfile()">Edit Profile</button><br>';
        userProfileHTML += '</div>';

        userProfileDiv.innerHTML = userProfileHTML;

      })
      .catch(error => {
        console.error('Error fetching user profile data:', error);
        // Handle the error as needed
      });
  } else {
    // User is not logged in
    userProfileDiv.innerHTML = `
      <p>You are not logged in currently. Please <a href="login.html">login here</a>!</p>
      <strong>Name:</strong> Guest<br>
      <div id="edit-profile-options">
        <button class="btn mt-3" onclick="editProfile()">Edit Profile</button><br>
      </div>
    `;
  }
}


// Function to update user profile details
function updateProfile() {
  const user = auth.currentUser;
  const displayName = document.getElementById('displayName').value;
  const profileImageURL = document.getElementById('profileImage').value;
  const userAddress = document.getElementById('userAddress').value;

  // Update display name and photoURL
  user.updateProfile({
    displayName: displayName,
    photoURL: profileImageURL
  })
  .then(() => {
    // Save updated user data to the Realtime Database
    const userId = user.uid;
    const userRef = database.ref(`users/${userId}/profile`);

    // Update the user's profile details inside the "profile" container
    userRef.update({
      displayName: displayName,
      photoURL: profileImageURL,
      address: userAddress  // Include the address in the database
    });

    // Update the address in the user object
    user.address = userAddress;

    // Display a success message
    alert('Profile updated successfully.');

    // Optionally, you can also refresh other parts of the user profile display
    displayUserProfile(user);
  })
  .catch((error) => {
    alert(`Error updating profile: ${error.message}`);
  });
}


// Function to handle edit profile
function editProfile() {
  const userProfileDiv = document.getElementById('user-profile');

  const user = auth.currentUser;
  if (user) {
    // Display a form for the user to edit profile details
    let editProfileHTML = `
      <h3>Edit Profile</h3>
      <form id="editProfileForm">
        <label class="fw-5 mb-2" for="displayName">Display Name:</label><br/>
        <input class="mb-3" type="text" id="displayName" value="${user.displayName || ''}" required><br>

        <label class="fw-5 mb-2" for="profileImage">Profile Image URL:</label><br>
        <input class="mb-3" type="url" id="profileImage" value="${user.photoURL || ''}"><br>
        <button type="button" class="btn me-2 mb-4" onclick="updateProfileImage()">Update Image</button>
        <button type="button" class="btn mb-4" onclick="resetProfileImage()">Reset Image</button><br>

        <label class="fw-5 mb-2" for="userAddress">Address:</label><br>
        <textarea class="mb-4" id="userAddress">${user.address || ''}</textarea><br>

        <button type="button" class="btn me-2 mb-2" onclick="updateProfile()">Update Profile</button>
        <button type="button" class="btn me-2 mb-2" onclick="changePasswordWithVerification()">Change Password</button>
        <button type="button" class="btn mb-2" onclick="cancelEdit()">Back</button>
      </form>
    `;

    userProfileDiv.innerHTML = editProfileHTML;
  }
}

// Function to update profile image URL
function updateProfileImage(callback) {
  const user = auth.currentUser;
  const profileImageURL = document.getElementById('profileImage').value;

  // Update profile image URL
  user.updateProfile({
    photoURL: profileImageURL
  })
  .then(() => {
    // Display a success message
    alert('Profile image updated successfully.');

    // Update the displayed profile image immediately
    displayGoogleProfileImage();

    // Call the callback function to refresh the modal content
    if (typeof callback === 'function') {
      callback();
    }
  })
  .catch((error) => {
    alert(`Error updating profile image: ${error.message}`);
  });
}

// Call the updateProfileImage function with the displayGoogleProfileImage callback
updateProfileImage(displayGoogleProfileImage);


// Function to reset profile image to default Google profile image
function resetProfileImage() {
  const user = auth.currentUser;
  const googleProvider = new firebase.auth.GoogleAuthProvider();

  // Check if the user is Google authenticated
  if (user.providerData.some((userInfo) => userInfo.providerId === googleProvider.providerId)) {
    // Get the default Google profile image URL
    const defaultGoogleProfileImageURL = user.providerData.find((userInfo) => userInfo.providerId === googleProvider.providerId)?.photoURL;

    if (defaultGoogleProfileImageURL) {
      // Reset profile image to the default Google profile image
      user.updateProfile({
        photoURL: defaultGoogleProfileImageURL
      })
      .then(() => {
        // Display a success message
        alert('Profile image reset to default Google profile image.');

        // Update the displayed profile image immediately
        displayGoogleProfileImage();
      })
      .catch((error) => {
        alert(`Error resetting profile image: ${error.message}`);
      });
    } else {
      // Default Google profile image URL not found
      alert('Error: Default Google profile image URL not found.');
    }
  } else {
    // User is not Google authenticated
    alert('Resetting profile image is only available for Google authenticated users.');
  }
}




// Function to handle changing password with email verification
function changePasswordWithVerification() {
  const user = auth.currentUser;

  if (user) {
    // Send a password reset email to the user
    auth.sendPasswordResetEmail(user.email)
      .then(() => {
        alert('Password reset email sent. Check your inbox to set a new password.');
      })
      .catch((error) => {
        alert(`Password reset email error: ${error.message}`);
      });
  }
}


// Function to handle canceling edit profile
function cancelEdit() {
  // Reset the user profile display
  const userProfileDiv = document.getElementById('user-profile');
  userProfileDiv.innerHTML = '';
  
  // Re-display the user profile
  const user = auth.currentUser;
  if (user) {
    displayUserProfile(user);
  }
}



// Function to open the modal
function openModal() {
  const modal = document.getElementById('myModal');
  modal.style.display = 'block';
  updateModalContent(); // Update content when modal is opened
}

// Function to close the modal
function closeModal() {
  const modal = document.getElementById('myModal');
  modal.style.display = 'none';
}

// Function to update modal content based on user's authentication status
function updateModalContent() {
  const modalContent = document.getElementById('modalContent');
  const user = auth.currentUser;

  // Clear existing content
  modalContent.innerHTML = '';

  // Check if the user is signed in
  if (user) {
    const googleProvider = new firebase.auth.GoogleAuthProvider();
    const googleUserInfo = user.providerData.find((userInfo) => userInfo.providerId === googleProvider.providerId);

    // Check if there is an updated profile image in the user object
    const updatedProfileImage = user.photoURL;

    // Create an img element
    const profileImage = document.createElement('img');
    profileImage.classList.add('rounded', 'mt-3', 'meta-author');

    // Set the source of the image based on availability
    profileImage.src = updatedProfileImage || (googleUserInfo && googleUserInfo.photoURL) || 'https://example.com/default-google-profile-image.jpg';
    profileImage.alt = 'Profile Image';

    // Append the img element to the div
    modalContent.appendChild(profileImage);

    // Display email, "Show Profile" link, and logout button
    modalContent.innerHTML += `<p class="text-truncate mt-2 mb-0">${user.email}</p>`;
    modalContent.innerHTML += '<a class="fs-7" href="/p/profile.html">Go to Profile</a><br/>';
    modalContent.innerHTML += '<button class="btn mt-3" onclick="logout()">Logout</button>';
  } else {
    // User is not logged in
    // Display a message and a login button
    modalContent.innerHTML += '<p>You are not logged in.</p>';
    modalContent.innerHTML += '<a class="btn" href="/p/login.html">Login</a>';
  }
}


// Listen for authentication state changes
auth.onAuthStateChanged((user) => {
  // Update modal content when authentication state changes
  updateModalContent();

  // Close the modal when the user gets logged out
  if (!user) {
    closeModal();
  }
});



// Listen for authentication state changes
auth.onAuthStateChanged((user) => {
  // Update modal content when authentication state changes
  updateModalContent();

  // Close the modal when the user gets logged out
  if (!user) {
    closeModal();
  }
});

}).catch(error => {
    // Handle error if scripts failed to load
    console.error('Error loading Firebase scripts:', error);
});
