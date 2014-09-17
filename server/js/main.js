//** 

function AppViewModel() {
    var self = this;
 
    self.shadow = ko.observable(false);

    var source = [
        { 
          id: 'sdcsdcsdc', 
          photo: 'http://cs614820.vk.me/v614820609/1cf72/E9VYtIn90Kk.jpg', 
          listen: 'linkinPark: Lost in the Echo', 
          listeners: 0,
          size: 250,
          played: false },
        { 
          id: 'sdcsdcsdc', 
          photo: 'http://cs614820.vk.me/v614820609/1cf72/E9VYtIn90Kk.jpg', 
          listen: 'linkinPark: Lost in the Echo', 
          listeners: 0,
          size: 150,
          played: false },          
    ];
    self.bc = ko.mapping.fromJS(source);

    self.play = function() {
        this.listeners(this.listeners() + 1);
        this.played(true);
        self.shadow(true);
        console.log(this.id());
    };
 
    self.pause = function() {
        this.played(false);
        self.shadow(false);
        this.listeners(this.listeners() - 1);
    };
}

function init() {
  ko.applyBindings(new AppViewModel());
}