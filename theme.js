 //<![CDATA[

 var startIndex = 1; // Initial start index
  var maxResults = parseInt(document.getElementById('blog-posts').getAttribute('data-items')); // Number of posts to load each time
  var totalResults = 0; // Total number of posts
  var totalPostsDisplayed = 0; // Track the total number of posts displayed


function loadBloggerPosts() {
    if (document.getElementById('load-more').innerText === "That's All") return; // Don't load more if all posts have been loaded
    var button = document.getElementById('load-more');
    button.disabled = true; // Disable the button while loading
    button.innerHTML = `<svg class="circular me-2" style="width: 24px;" viewBox="25 25 50 50"><circle class="path" cx="50" cy="50" fill="none" r="20" stroke-miterlimit="10" stroke-width="5"></circle></svg> Loading...`; // Update button text to indicate loading
    var label = document.getElementById('blog-posts').getAttribute('data-label') || 'movie'; // Default label is 'movie' if data-label attribute is not provided
    var script = document.createElement('script');
    script.src = '/feeds/posts/default/-/' + label + '?alt=json-in-script&max-results=' + maxResults + '&start-index=' + startIndex + '&callback=handleBloggerResponse';
    document.body.appendChild(script);
}

function handleBloggerResponse(response) {
    var posts = response.feed.entry;
    var output = '';
    for (var i = 0; i < posts.length; i++) {
        var thumbnailUrl = '';
        var commentsCount = parseInt(posts[i].thr$total.$t);
        var publishedDate = new Date(posts[i].published.$t);
        var formattedDate = publishedDate.toLocaleDateString();
        if (posts[i].media$thumbnail) {
            // Get the larger thumbnail size if available
            thumbnailUrl = posts[i].media$thumbnail.url.replace(/\/s\d+(-\w+)?\//, '/s800/'); // Replace '/s' with '/s800/' for higher resolution
        }
        output += '<div class="mb-4">';
        output += '<a  href="' + posts[i].link[4].href + '">';
        if (thumbnailUrl !== '') {
            output += '<img src="' + thumbnailUrl + '" alt="Thumbnail"><br></a>'; // Include thumbnail if available
        }
        output += '<h3 class="post-title item-title fs-6 fw-5"><a class="text-reset" href="' + posts[i].link[4].href + '">' + posts[i].title.$t + '</a></h3>';
        // Display published date
        output += '<span class="d-flex justify-content-between"><small class="published-date">' + formattedDate + '</small>';
        // Display comment count if greater than 0
        if (commentsCount > 0) {
            output += '<small class="comment-count"><svg aria-hidden="true" class="me-1 jt-icon"><use xlink:href="#i-comment"></use></svg>' + commentsCount + '</small></span>';
        }
        output += '</div>';
        totalResults++;
    }
    document.getElementById('blog-posts').innerHTML += output;
    totalPostsDisplayed += posts.length;

    if (totalPostsDisplayed >= response.feed.openSearch$totalResults.$t) {
        document.getElementById('load-more').innerText = 'That\'s All';
    } else {
        startIndex += maxResults; // Update startIndex for the next request
        document.getElementById('load-more').disabled = false; // Enable the button after loading
        document.getElementById('load-more').innerText = 'Load More';
    }
}

// Load initial posts and total results when the page is ready
document.addEventListener('DOMContentLoaded', function() {
    loadBloggerPosts();
});

// Load more posts when the "Load More" button is clicked
document.getElementById('load-more').addEventListener('click', loadBloggerPosts);

  //]]>
  
