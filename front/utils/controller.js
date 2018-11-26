import { avengers } from './avengers.js';

export default class Avengers {
    constructor(client, dom) {
        // Create the API object
        const api = client.createProxyTaskService();
        // ZetaPush API
        this.api = api;
        // Your Avenger Object
        this.avenger = {};
        // Avengers List
        this.avengers = avengers;
        // DOM Helper
        this.dom = dom;
        // ZetaPush client
        this.client = client;
        // Init modal
        this.callAvengers();
        // Scroll glue for chat inbox
        const observer = new MutationObserver((mutation) => {
            dom.avengersChat.scrollTop = dom.avengersChat.scrollHeight;
        });
        observer.observe(dom.avengersChat, { attributes: true, childList: true });
    }
    async onConnectionEstablished() {
        this.dom.avengersValidSelection.disabled = false;
        return Promise.all([
            this.getAllMessages(),
            this.api.createConversation(),
            this.api.addMeToConversation(),
        ]);
    }
    /**
     * Listen onAvengersMessage event
     */
    onAvengersMessage(sent) {
        if (
            sent.data.message.type === 'attack' &&
            sent.data.message.attacker != this.client.getUserId()
        ) {
            this.onAttackReceive();
        }
        this.addMessageToFrame(sent.data.message.content);
    }

    /**
     * Function to init avengers list with avatar
     */
    callAvengers() {
        const elements = this.avengers.map((avenger) => {
            const option = document.createElement('option');
            option.text = avenger.name;
            option.value = avenger.id;
            this.dom.avengersSelect.add(option);
        });
        this.dom.avengersModalAvatar.src = this.avengers[0].avatar;
        this.dom.avengersModal.classList.add('on');
    }

    /**
     * Function to select your avenger and show Chat view
     */
    selectAvenger() {
        this.avenger = this.avengers[this.dom.avengersSelect.value];
        console.log('Avengers-selected', { avenger: this.avenger });
        this.dom.avengersModal.classList.remove('on');
        this.dom.avengersContainer.classList.add('on');
    }
    /**
     * Function to watch avenger selection change
     */
    onSelectChange() {
        const avenger = this.avengers[this.dom.avengersSelect.value];
        this.dom.avengersModalAvatar.src = avenger.avatar;
        console.log('Avengers-on-select', { avenger });
    }
    /**
     * Function to attack an avenger
     */
    attackAvenger() {
        const avengerMessage = this.createMessage(
            `${this.avenger.name} attacks with <span>${
            this.avenger.skills[0]
            }</span> !`,
        );
        this.api.sendMessage({
            content: avengerMessage,
            type: 'attack',
            attacker: this.client.getUserId(),
        });
    }
    // Trigger alert when an avenger attack you
    onAttackReceive() {
        clearTimeout(this.attackTimer);
        this.dom.container.classList.add('attack');
        this.attackTimer = setTimeout(
            () => this.dom.container.classList.remove('attack'),
            2000,
        );
    }
    /**
     * Function to message avengers
     */
    messageAvenger() {
        const message = this.dom.avengersMessageInput.value;
        if (message.length > 0) {
            // Add message to the room
            const avengerMessage = this.createMessage(message);
            // Add message to stack
            this.api.sendMessage({ content: avengerMessage });
        }
        return false;
    }
    // Generic message factory
    createMessage(content) {
        return `
      <div id="avengers-message-container">
        <img src="${this.avenger.avatar}" title="${this.avenger.name}">
        <p>${content}</p>
      </div>
    `;
    }
    /**
     * Get all messages
     */
    getAllMessages() {
        this.api.getMessages().then(({ content }) => {
            const messages = content.sort((a, b) => a.ts - b.ts);
            messages.forEach((element) => {
                this.addMessageToFrame(element.data.content);
            });
        });
    }
    /**
     * Display the message
     * @param {Object} message
     */
    addMessageToFrame(message) {
        this.dom.avengersChat.insertAdjacentHTML('beforeend', message);
        this.dom.avengersMessageInput.value = '';
        this.dom.avengersMessageInput.focus();
    }
}