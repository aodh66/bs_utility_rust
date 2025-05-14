import { invoke } from "@tauri-apps/api/core";

let greetInputEl: HTMLInputElement | null;
let greetMsgEl: HTMLElement | null;
// console.log("hello");


async function greet() {
  if (greetMsgEl && greetInputEl) {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    greetMsgEl.textContent = await invoke("greet", {
      name: greetInputEl.value,
    });
  }
}

window.addEventListener("DOMContentLoaded", () => {
  greetInputEl = document.querySelector("#greet-input");
  greetMsgEl = document.querySelector("#greet-msg");
  document.querySelector("#greet-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    greet();
  });
});

// Write methods to update fields in this
let params = {
  // inputRequest: true,
  inputFolder: "",
  backupFolder: "",
  snapshotFolder: "",
  backupTime: 0,
  backupNumber: 0,
  
}

// TODO Could write smaller functions to handle sending the stuff for each button, 
// TODO and this is just the aggregate handler that sends them to the backend
function handleClick(event: Event) {
  const target = event.target as HTMLElement
  const id = target.id
  // console.log(target.id);

  // TODO make this either into a clean looking one liner version or a switch statement like shown
//   switch (id) {
//     case "inputFolderBtn": processPending(); break;
//     case "backupFolderBtn": processApproved(); break;
//     default: handleError();
// }
    if (id == "inputFolderBtn") {
      // request input folder
        // console.log("click");
        // invoke('my_custom_command');
        // You can then call a method to update params where you are console.logging here
        invoke('get_folder', { invokeMessage: 'input' })
            .then((inputFolder) => console.log(inputFolder))
            .catch((error) => console.error(error));

    } else
    if (id == "backupFolderBtn") {
      // request backup folder
        // Invoking an async function
        invoke('my_custom_command', { value: 'Hello, Async!' }).then(() =>
            console.log('Completed!')
        );
    } else
    if (id == "snapshotFolderBtn") {
      // request snapshot folder
    } else
    if (id == "backupBtn") {
      // start backup
    } else
    if (id == "snapshotBtn") {
      // take snapshot
    } else
    if (id == "snapshotHotkeyBtn") {
      // register snapshot hotkey
    } else
    if (id == "newProfileBtn") {
      // create new profile
    } else
    if (id == "saveProfileBtn") {
      // save profile
    } else
    if (id == "loadProfileBtn") {
      // load profile
    }


    
}
// const inputFolderBtn = document.querySelector("#inputFolderBtn")
// inputFolderBtn?.addEventListener("click", handleClick("inputFolderBtn"))
// document.querySelector("#inputFolderBtn")?.addEventListener("click", (event) => handleClick(
//   // "inputFolderBtn",
// event
// ))
document.querySelectorAll("button")?.forEach((button) => {
  button.addEventListener("click", (event) => handleClick(event))
})
// TODO Could maybe add this event listener to all buttons in one go, pass in the event to handleClick
