document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#view-email').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  document.querySelector('#label').innerHTML = "New Email";
  // Disable submit button until there is text
  document.querySelector('#submit').disabled = true;
  document.querySelector('#compose-body').onkeyup = () => {
    if (document.querySelector('#compose-body').value.length > 0) {
      document.querySelector('#submit').disabled = false;
    }
    else {
      document.querySelector('#submit').disabled = true;
    }
  }
  // When submit button is clicked, send the email through POST
  document.querySelector('#compose-form').onsubmit = () => {
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: document.querySelector('#compose-recipients').value,
          subject: document.querySelector('#compose-subject').value,
          body: document.querySelector('#compose-body').value
        })
    })
    .then(response => response.json())
    .then(result => {
        // If no error, then load sent mailbox
        if ("message" in result) {
          load_mailbox('sent');
        }
        else {
          alert(result.error)
        }
        // Print result
        console.log(result);
    });
    return false;
  }

}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#view-email').style.display = 'none';


  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Get all of the emails in the mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      emails.forEach(email => {
        // Create a div for each email
        const element = document.createElement('div');
        // If the email is read
        if (email.read === true) {
          element.setAttribute('class', "email-read")
        }
        else {
          element.setAttribute('class', "email-not-read")
        }
        // Display who sent the email, the subject, and the timestamp
        element.innerHTML = `<div class="container" style="border:1px solid">`;
        element.innerHTML += `<div class="row"><div class="col-sm">From: ${email.sender} Subject: ${email.subject}</div><div class="col-sm">${email.timestamp}</div>`;
        element.innerHTML += `</div></div>`;

        // If the email is clicked, then run view_email function
        element.addEventListener('click', () => view_email(mailbox, email.id));
        document.querySelector('#emails-view').append(element);

        // Print email
        console.log(email);

      });

    });

}

function view_email(mailbox, email_id) {
    // Show the email and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#view-email').style.display = 'block';

  // Email is read
  fetch(`/emails/${email_id}`, {
      method: 'PUT',
      body: JSON.stringify({
        read: true
      })
  })

  // Get the email
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
      document.querySelector('#view-email').innerHTML = `<h4>From: </h4>${email.sender}<h4>To:</h4>${email.recipients}`;
      document.querySelector('#view-email').innerHTML += `<h4>Subject:</h4> ${email.subject}<h4>Timestamp:</h4> ${email.timestamp}`;
      document.querySelector('#view-email').innerHTML += `<br><button id="reply" class="btn btn-sm btn-outline-primary">Reply</button>`;
      document.querySelector('#view-email').innerHTML += ` <button id="archive_element" class="btn btn-sm btn-outline-primary">Archive</button>`;
      document.querySelector('#view-email').innerHTML += `<hr> <span style="white-space: pre-line">${email.body}</span>`;

      // Mailbox is not sent mailbox
      if (mailbox !== 'sent') {

      // Put archive button if email is not archived
        if (email.archived == false) {
          document.querySelector('#archive_element').innerHTML = 'Archive';
          document.querySelector('#archive_element').onclick = () => archive(email.id);
        }
        // Otherwise put unarchive button
        else {
          document.querySelector('#archive_element').innerHTML = 'Unarchive';
          document.querySelector('#archive_element').onclick = () => unarchive(email.id);
        }}
      // Hide the archive button if the mailbox is sent
      else {
        document.querySelector('#archive_element').style.visibility = 'hidden';
      }

      // If reply button is clicked, run reply_email function
      document.querySelector('#reply').innerHTML = 'Reply';
      document.querySelector('#reply').onclick = () => reply_email(email);


    // Print email
    console.log(email);

  });
}

function reply_email(email) {
  // Run compose email function
  compose_email();

  let email_subject = email.subject

  if (email_subject.startsWith("Re:")) {
      document.querySelector('#compose-subject').value = email_subject;
    }
  // If email subject does not start with Re:
  else {
      document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
    }
  document.querySelector('#label').innerHTML = "Reply";
  // Pre-fill values
  document.querySelector('#compose-recipients').value = email.sender;
  document.querySelector('#compose-body').value = `\n-------On ${email.timestamp} ${email.sender} wrote: \n ${email.body}`


}

function archive(email_id) {
  // Archive email
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: true
    })
  })
  location.reload();
  load_mailbox('inbox');

}

function unarchive(email_id) {
  // Unarchive email
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: false
    })
  })
  location.reload();
  load_mailbox('inbox');

}
