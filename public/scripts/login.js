/* change messages on screen */
function changeInstruction() {
  let instruction = document.getElementById("messages");
  instruction.innerHTML = instructions[instructionIndex];
  instructionIndex = (instructionIndex + 1) % instructions.length;
}

/* messages */
let instructions = ["Create playlists", "Save and share"];

let instructionIndex = 0;

/* loop through messages when all content has loaded */
window.onload = function () {
  /* set the first message */
  changeInstruction();
  /* set the instruction change speed */
  setInterval(changeInstruction, 2000);
};

/* request login from server */
function pagelogin() {
  let email = document.getElementById("email").value;
  let password = document.getElementById("password").value;

  let data = {
    email,
    password,
  };

  /* link to authentication */
  fetch("/auth", {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Origin": "*",
    },

    /* post request */
    method: "POST",
    body: JSON.stringify(data),
  })
    .then((responseJSON) => responseJSON.json())
    .then((body) => {
      console.log(body);
    })
    .catch((error) => {
      alert(error);
    });
}

/* request registration for page from server */
function pageregistration() {
  let email = document.getElementById("email").value;
  let password = document.getElementById("password").value;

  let data = {
    email,
    password,
  };

  /* link to authentication */
  fetch("/auth", {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Origin": "*",
    },

    /* post request */
    method: "POST",
    body: JSON.stringify(data),
  })
    .then((responseJSON) => responseJSON.json())
    .then((body) => {
      console.log(body);
    })
    .catch((error) => {
      alert(error);
    });
}

/* user provided id is hidden */
function closeForm(id) {
  document.getElementById(id).style.display = "none";
}

/* user provided id is visiable */
function openForm(id) {
  document.getElementById(id).style.display = "block";
}
