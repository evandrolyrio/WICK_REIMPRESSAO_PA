sap.ui.define([
	"reimpressao/paZPP_REIMPRESSAO_PA/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ndc/BarcodeScanner",
	"sap/m/MessageBox"
], function(BaseController, JSONModel, BarcodeScanner, MessageBox) {
	"use strict";

	return BaseController.extend("reimpressao.paZPP_REIMPRESSAO_PA.controller.Reimpressao", {

		onInit: function() {

			this.setModel(this.getOwnerComponent().getModel());

			this.setModel(new JSONModel({
				busy: false,
				//FilterData
				ReimpressaoSet: [],
				Impressora: "",
				Peso: ""
			}), "viewModel");
			var that = this;
			this.getModel().metadataLoaded().then(function() {
				that.getModel().read("/ImpressoraSet", {
					success: function(oData) {
						that.getModel("viewModel").setProperty("/ImpressoraSet", oData.results);
					}
				});
			});			
			// this._currentContext = this.getSource().getBindingContext();
			this.oDialog = new sap.ui.xmlfragment("reimpressao.paZPP_REIMPRESSAO_PA.view.fragment.DisplayReimpDialog", this);
			if (this.oDialog) {
				this.getView().addDependent(this.oDialog);

				this.oDialog.setModel(this.getModel());
				this.oDialog.setModel(new JSONModel({
					Aufnr: ""
				}, "dialog"));

				this.oDialog.setBindingContext(this._currentContext);
				// this.oDialog.setBindingContext(that);
				this.oDialog.open();
			}			
		},
		goToReimp: function(oEvent) {
			var oDialogData = this.oDialog.getModel().getData();
			var that = this;
			this.oDialog.close();
			this.oDialog.destroy(true);
			
			if ( !oDialogData.Aufnr ) {
				oDialogData.Aufnr = "0";
			}
			var oModel = this.getModel();


			this.getModel("viewModel").setProperty("/busy", true);
			oModel.invalidate();
			oModel.callFunction("/GetReimpressao", {
				method: "GET",
				urlParameters: {
					Aufnr: oDialogData.Aufnr
				},
				success: function(oData) {
					that.getModel("viewModel").setProperty("/ReimpressaoSet", oData.results);
					that.getModel("viewModel").setProperty("/busy", false);
					that.getView().byId("tbReimpressao").getBinding("items").refresh();
				},
				error: function(error) {
					// alert(this.oResourceBundle.getText("ErrorReadingProfile"));
					// oGeneralModel.setProperty("/sideListBusy", false);
					that.getModel("viewModel").setProperty("/busy", false);
				}
			});
		},	
		onChangeImpressora: function(oEvent) {
			var oViewModel = this.getModel("viewModel");
			var sData = oEvent.getParameter("selectedItem").getBindingContext().getObject().Id_impressora;
			oViewModel.setProperty("/Impressora", sData);

		},		
		Imprimir: function(oEvent) {
			var oTable = this.getView().byId("tbReimpressao");
			// var oSelected = oTable.getSelectedItems()[0].oBindingContexts.viewModel.getObject();
			var items = oTable.getSelectedItems().length;
			var oModel = this.getModel();
			var that = this;
			that.getModel("viewModel").setProperty("/busy", true);
			var oData = this.getModel("viewModel").getData();
			for (var i = 0; i < items; i++) {

				var item = oTable.getSelectedItems()[i].oBindingContexts.viewModel.getObject();

				oModel.invalidate();
				oModel.callFunction("/ReimprimeEtiqueta", {
					method: "GET",
					urlParameters: {
						Zetiqid: item.Zetiqid,
						Impressora: oData.Impressora,
						Gamng: item.Gamng
					},
					success: function(oData) {
						that.getModel("viewModel").setProperty("/busy", false);
						MessageBox.information("Impressão realizada com sucesso");
					},
					error: function(error) {
						// alert(this.oResourceBundle.getText("ErrorReadingProfile"));
						// oGeneralModel.setProperty("/sideListBusy", false);
						that.getModel("viewModel").setProperty("/busy", false);
						MessageBox.information("Erro na impressão");
					}
				});
			}
		}
	});
});