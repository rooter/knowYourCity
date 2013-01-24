window.GameView = Backbone.View.extend({

    initialize: function () {
        this.render();
    },

    render: function () {
      var self = this;
        // $(this.el).html(this.template(this.model.toJSON()));
        //console.log(this.el);
        $('#score').text("0");
		$(this.el).html(this.template());
		// console.log(this.template());
		// this.initMap();

        return this;
    }
});