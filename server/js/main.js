//** 

function AppViewModel() {
    var self = this;

    var source = [
        { 
          id: 'sdcsdcsdc', 
          photo: 'http://cs614820.vk.me/v614820609/1cf72/E9VYtIn90Kk.jpg', 
          listen: 'linkinPark: Lost in the Echo', 
          listeners: 1,
          played: false },
        { 
          id: 'sdcsdcsdc', 
          photo: 'http://cs424521.vk.me/v424521845/d607/FZUvkJPQIRw.jpg', 
          listen: 'linkinPark: Lost in the Echo', 
          listeners: 2,
          played: false },  
        { 
          id: 'sdcsdcsdc', 
          photo: 'http://pp.vk.me/c622018/v622018626/1bdc/xl8-SRlppSo.jpg', 
          listen: 'linkinPark: Lost in the Echo', 
          listeners: 2,
          played: false },            
        { 
          id: 'sdcsdcsdc', 
          photo: 'http://cs619630.vk.me/v619630097/14784/ig6qI92z20c.jpg', 
          listen: 'linkinPark: Lost in the Echo', 
          listeners: 3,
          played: false },                   
    ];
    var data = circles(source);

    self.shadow = ko.observable(false);
    self.wrapSize = ko.observable(data.wrap);
    self.bc = ko.mapping.fromJS(data.array);

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



/////////

var circles = function(input) {

  _.each(input, function(item) {
    item.origin = _.clone(item);
  });       
  var root = {
     "name": "cluster",
     "children": input,
  };     

  var diameter = 1000;
  var format = d3.format(",d");

  var pack = d3.layout.pack()
      .size([diameter, diameter])
      .value(function(d) { return d.listeners;});

  var svg = d3.select("body").append("svg")
      .attr("width", 0)
      .attr("height", 0)
      .append("g");

  var res = [];
  var first = true;
  var node = svg.datum(root).selectAll(".node")
    .data(pack.nodes)
    .enter().append("g")
    .attr("transform", function(d) {
        if (!first) {
            var obj = _.clone(d.origin);
            obj.left = d.x - d.r;
            obj.top = d.y - d.r;
            obj.size = d.r * 2;
            res.push(obj);            
        }
        first = false;
        return "translate(" + d.x + "," + d.y + ")"; 
     });

  // My calculate Rect
  var k = 250 / _.max(res, function(item) { return item.size; }).size;
  _.each(res, function(item) {
      item.size = Math.round(item.size*k) - 25;
      item.top = Math.round(item.top*k);
      item.left = Math.round(item.left*k);
  });
  wrapSize = Math.round(diameter * k);
  console.log(res);
  return {
    array: res,
    wrap: wrapSize, 
  };
}
