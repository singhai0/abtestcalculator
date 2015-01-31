'use strict';

/**
 * External dependencies
 */
var React = require( 'react' ),
	isInteger = require( 'is-integer' ),
	_ = require( 'lodash' ),
	ReactZeroClipboard = require( 'react-zeroclipboard' ),
	url = require( 'url' );

/**
 * Internal dependencies
 */
var ConversionDataForm = require( './conversion-data-form' ),
	SampleProportionsGraph = require( './sample-proportions-graph' ),
	ImprovementGraph = require( './improvement-graph' ),
	Variation = require( './variation' ),
	ABTestSummary = require( './abtest-summary' ),
	utils = require( './utils' );

module.exports = React.createClass( {
	getInitialState: function() {
		var params = url.parse( document.URL, true ).query,
			queryParticipantsA, queryConversionsA, queryParticipantsB, queryConversionsB,
			participantsA = 500,
			conversionsA = 200,
			participantsB = 500,
			conversionsB = 220;

		if ( ! _.isEmpty( params ) ) {
			queryParticipantsA = params.ap;
			queryConversionsA = params.ac;
			queryParticipantsB = params.bp;
			queryConversionsB = params.bc;

			if ( utils.isInteger( queryParticipantsA ) && utils.isInteger( queryConversionsA ) && utils.isInteger( queryParticipantsB ) && utils.isInteger( queryConversionsB ) ) {
				participantsA = +queryParticipantsA;
				conversionsA = +queryConversionsA;
				participantsB = +queryParticipantsB;
				conversionsB = +queryConversionsB;
			} else {
				// Rather than show an error message about not being able to parse the params
				// we'll simply not include any defaults in the fields
				participantsA = conversionsA = participantsB = conversionsB = '';
			}
		}

		return {
			participantsA: participantsA,
			conversionsA: conversionsA,
			participantsB: participantsB,
			conversionsB: conversionsB
		};
	},

	updateConversionData: function( participantsA, conversionsA, participantsB, conversionsB ) {
		this.setState( {
			participantsA: participantsA,
			conversionsA: conversionsA,
			participantsB: participantsB,
			conversionsB: conversionsB
		} );
	},

	getVariations: function() {
		return {
			a: new Variation( 'Variation A', '#F1C40F', this.state.participantsA, this.state.conversionsA ),
			b: new Variation( 'Variation B', '#B6E2FF', this.state.participantsB, this.state.conversionsB )
		};
	},

	urlCopied: function() {
		alert( 'The URL for these results was copied to your clipboard.' );
	},

	hasIntegerInputs: function() {
		return isInteger( this.state.participantsA ) &&
			isInteger( this.state.conversionsA ) &&
			isInteger( this.state.participantsB ) &&
			isInteger( this.state.conversionsB );
	},

	hasMoreParticipantsThanConversions: function() {
		return this.state.conversionsA <= this.state.participantsA &&
			this.state.conversionsB <= this.state.participantsB;
	},

	hasGaussianDistributions: function() {
		var variations = this.getVariations();

		return variations.a.isGaussian() && variations.b.isGaussian();
	},

	getGraphsElement: function() {
		var variations;

		if ( utils.isCanvasSupported() ) {
			variations = this.getVariations();
			return (
				<div className="graphs">
					<SampleProportionsGraph variations={ variations } />
					<ImprovementGraph variations={ variations } />
				</div>
			);
		}
	},

	getCopyURLElement: function() {
		return (
			<div className="copy-url">
				<ReactZeroClipboard text={ this.getResultsURL() } onAfterCopy={ this.urlCopied }>
					<button>Copy URL to Clipboard</button>
				</ReactZeroClipboard>
			</div>
		);
	},

	getResultsURL: function() {
		return 'http://www.abtestcalculator.com?' +
			'ap=' + this.state.participantsA +
			'&ac=' + this.state.conversionsA +
			'&bp=' + this.state.participantsB +
			'&bc=' + this.state.conversionsB;
	},

	getErrorElement: function( errorMessage ) {
		return <p className="error">{ errorMessage }</p>;
	},

	getAnalysisElement: function() {
		return (
			<div>
				{ this.getGraphsElement() }
				<ABTestSummary variations={ this.getVariations() } />
			</div>
		);
	},

	render: function() {
		var copyUrlElement, results;

		if ( this.hasIntegerInputs() ) {
			if ( ! this.hasMoreParticipantsThanConversions() ) {
				results = this.getErrorElement( 'The number of conversions must be smaller than the number of participants.' );
			} else if ( ! this.hasGaussianDistributions() ) {
				results = this.getErrorElement( 'There is not enough data yet to make a conclusion about the results of this test.' );
			} else {
				results = this.getAnalysisElement();
				copyUrlElement = this.getCopyURLElement();
			}
		}

		return (
			<div>
				<div className="form-container">
					<ConversionDataForm variations={ this.getVariations() } onUpdate={ this.updateConversionData } />
					{ copyUrlElement }
				</div>
				<div className="results">{ results }</div>
			</div>
		);
	}
} );
