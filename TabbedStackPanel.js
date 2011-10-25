Ext.ns('Jarvus.mobile');

Jarvus.mobile.TabbedStackPanel = Ext.extend(Jarvus.mobile.StackPanel, {


	appTabsVisible: true


	,initComponent: function() {

		Jarvus.mobile.TabbedStackPanel.superclass.initComponent.apply(this, arguments);

		this.on('beforeCardLoad', function(card, options) {
			this.updateActiveTab(card, options);
			this.setTabsVisible(!card.hideAppTabs);
		}, this);

		this.on('beforeCardUnload', function(card, prevCard) {
			this.updateActiveTab(prevCard);
			this.setTabsVisible(!prevCard.hideAppTabs);
		}, this);

		this.on('afterrender', function() {
			if(this.initialTab)
			{
				var tab = this.getTabById(this.initialTab);
				this.loadCard(tab.cardType, {animate: 'fade', clearStack: true});
			}
		}, this);
	}

	,buildDocks: function() {

		var dockCfg = Jarvus.mobile.TabbedStackPanel.superclass.buildDocks.apply(this, arguments);		

		this.tabBar = this.buildTabBar();
		this.tabBar.on('change', this.onTabChange, this);

		if(this.appTabsVisible)
			dockCfg.push(this.tabBar);

		return dockCfg;
	}

	,buildItems: function() {
		// without this, sencha fire's activate twice on the initial card...
		return [{xtype: 'component'}];
	}

	,buildTabBar: function() {
		return new Ext.TabBar({
			dock: 'bottom'
			,layout: {
				pack:'center'
			}
			,ui: 'dark'
			,defaults: {
				iconMask: true
			}
			,items: [{
				text: 'Home'
				,itemId: 'home'
				,iconCls: 'home'
				,cardType: 'home'
			},{
				text: 'Search'
				,itemId: 'search'
				,iconCls: 'search'
				,cardType: 'search'
			}]
		});
	}
    
	,onTabChange: function(tabBar, tab) {

		// ignore if a card transition is in progress
		if(this.pendingCard)
			return;

		if(this.getActiveItem().xtype == tab.cardType)
			return;

		var topCard = this.items.get(0)
			,tabAlreadyActive = tab.getEl().hasCls('x-tab-active');

		if(tabAlreadyActive && (topCard.xtype == tab.cardType))
		{
			// click was on already active tab, clear stack and return to top card
			this.loadCard(topCard, {clearAfter: topCard, animate: 'slide', reverse: true});
		}
		else
		{
			var card = tab.cardType ? tab.cardType : {html: 'This tab is not yet implemented', navSection: tab.itemId};
			this.loadCard(card, {clearStack: true, animate: 'slide', reverse: tabAlreadyActive});
		}
	}


	,updateActiveTab: function(card, options) {
		options = options || {};

		// detect tab change
		var nextTab = this.getTabById(card.navSection);

		if(nextTab)
		{
			if(nextTab != this.activeTab)
			{
				options.reverse = (this.tabBar.items.indexOf(nextTab) <= this.activeTabIndex);
				this.markActiveTab(nextTab);
			}
		}
		else
			this.unmarkTabs();

		return options;
	}


	,markActiveTab: function(tab) {

		if(!tab.rendered)
		{
			tab.on('afterrender', Ext.createDelegate(this.markActiveTab, this, [tab]));
			return;
		}

		tab.getEl().radioCls('x-tab-active');
		this.activeTab = tab;
		this.activeTabIndex = this.tabBar.items.indexOf(tab);
	}

	,unmarkTabs: function() {
		if(this.activeTab)
		{
			this.activeTab.removeCls('x-tab-active');
			this.activeTab = null;
			this.activeTabIndex = null;
		}
	}

	,getTabById: function(tabId) {
		if(!tabId) return false;
		return this.tabBar.items.findBy(function(tab) {
			return (tab.itemId == tabId);
		});
	}

	,setTabsVisible: function(visible) {
		if(this.appTabsVisible == visible)
			return;

		this.appTabsVisible = visible;

		if(visible)
			this.addDocked(this.tabBar);
		else
			this.removeDocked(this.tabBar, false);

	}



});