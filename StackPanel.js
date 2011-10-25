Ext.ns('Jarvus.mobile');

Jarvus.mobile.StackPanel = Ext.extend(Ext.Panel, {

	layout: 'card'

	,title: false
	,titleUi: 'dark'
	,titleBarVisible: true
	,disableTitleBar: false
	,maxBackLength: false
	,maxTitleLength: false

	,initComponent: function() {

		this.items = this.buildItems();
		this.dockedItems = this.buildDocks();

		Jarvus.mobile.StackPanel.superclass.initComponent.apply(this, arguments);

	}

	,buildDocks: function() {

		if(this.disableTitleBar)
			return [];


		this.backButton = new Ext.Button({
			text: 'Back'
			,ui: 'back'
			,hidden: true
			,scope: this
			,handler: this.goBack
		});

		this.titleBar = new Ext.Toolbar({
			itemId: 'titleBar'
			,cls: 'titleBar'
			,items: [this.backButton, {xtype: 'spacer'}]
			,title: this.title
			,ui: this.titleUi
		});

		if(this.titleBarVisible)
			return [this.titleBar];
		else {
			return[];
		}
	}

	,buildItems: function() {
		return [];
	}

	,setTitle: function(title) {

		if(this.maxTitleLength && title[0] != '<') // don't trim HTML titles, consider them preformatted
			title = Ext.util.Format.ellipsis(title, this.maxTitleLength);

		this.titleBar.setTitle(title);
	}

	,setBackText: function(text) {
		if(this.disableTitleBar) return false;

		if(this.maxBackLength)
			text = Ext.util.Format.ellipsis(text, this.maxBackLength);

		this.backButton.setText(text);
	}

	,setBackVisible: function(visible) {
		if(this.disableTitleBar) return false;

		this.backButton.setVisible(visible);
	}

	,goBack: function() {
		var current = this.layout.getActiveItem()
			,wentBack = false;

		if(typeof current.goBack == 'function')
			wentBack = current.goBack();

		return wentBack || this.unloadCard();
	}

	,loadCard: function(card, options) {

		var currentCard = this.getActiveItem();

		if(card == currentCard)
			return true;

		if(this.pendingCard && card == this.pendingCard)
			return true;

		options = Ext.apply({
			animate: 'slide'
			,direction: 'left'
			,reverse: false
			,cover: false
			,reveal: false
			,clearStack: false
			,clearAfter: false
			,removeAfterLoad: false
		}, options || {});

		if(typeof card == "string")
			card = {xtype: card};

		// insantiate card
		card = Ext.create(card, 'panel');
		this.pendingCard = card;

		// set default prevCard
		if(!card.prevCard)
			card.prevCard = currentCard;

		if(false===this.fireEvent('beforeCardLoad', card, options))
		{
			return false;
		}

		this.setTitleBarVisible(!card.hideTitleBar);

		var afterRun = false
			,cardLoaded = function() {
				// suppress duplicate execution, why??? i dunno =[
				if(afterRun) return;
				afterRun = true;

				this.pendingCard = null;

				this.fireEvent('cardLoaded', this, card);

				if(options.clearStack)
					this.clearStack(card);
				else if(options.clearAfter)
					this.clearStackAfter(options.clearAfter)
				else
					this.setBackVisible(true);

				this.onCardActivate(card);

				if(options.removePrevious)
				{
					this.remove(this.layout.getPrev());
				}

			};

		var loadResult;
		if(options.animate)
		{
			loadResult = this.layout.setActiveItem(card, {
				type: options.animate
				,reverse: options.reverse
				,cover: options.cover
				,reveal: options.reveal
				,direction: options.direction
				,after: cardLoaded
				,scope: this
			});
		}
		else
		{
			loadResult = this.layout.setActiveItem(card);

			if(loadResult)
				Ext.defer(cardLoaded, 50, this);
		}

		if(loadResult === false)
			this.remove(card);
	}

	,unloadCard: function() {
		var current = this.layout.getActiveItem()
			,prevCard = this.layout.getPrev();

		if(!prevCard)
			return false;

		if(false===this.fireEvent('beforeCardUnload', current, prevCard))
		{
			return false;
		}

		this.setTitleBarVisible(!prevCard.hideTitleBar);

		// remove last card
		this.setBackVisible(this.items.length > 2);

		var afterRun = false;
		this.layout.prev({
			type: 'slide'
			,reverse: true
			,scope: this
			,after: function() {
				// suppress duplicate execution, why??? i dunno =[
				if(afterRun) return;
				afterRun = true;

				this.pruneCards();
				this.onCardActivate(prevCard);
				this.fireEvent('cardUnloaded', this, prevCard, current);
			}
		});


		return true;
	}

	,onCardActivate: function(card) {
		var newTitle = card.title || this.title
			,newPrevTitle = 'Back';

		if(newTitle)
			this.setTitle(newTitle);

		if(card.prevCard && card.prevCard.prevTitle)
			newPrevTitle = card.prevCard.prevTitle;

		this.setBackText(newPrevTitle);

		this.fireEvent('cardActivated', card);
	}


	,pruneCards: function() {
		var currentCard = this.layout.getActiveItem()
			,currentIndex = this.items.indexOf(currentCard);

		// destroy anything past the current card
		for(var i = this.items.length-1; i > currentIndex; i--)
		{
			this.remove(this.items.get(i));			
		}
	}

	,clearStack: function(exception) {
		exception = exception || this.layout.getActiveItem();

		this.items.each(function(item) {
			if(item != exception)
				this.remove(item);
		}, this);

		this.setBackVisible(false);
	}

	,clearStackAfter: function(card, exception) {
		var cardFound = false;

		this.items.each(function(item) {
			if(item == card)
				cardFound = true;
			else if(cardFound && item != exception)
				this.remove(item);
		}, this);

		this.setBackVisible(this.items.length > 1);
	}


	,setTitleBarVisible: function(visible) {
		if(this.titleBarVisible == visible)
			return;

		this.titleBarVisible = visible;

		if(visible)
			this.addDocked(this.titleBar, 0);
		else
			this.removeDocked(this.titleBar, false);

	}
});