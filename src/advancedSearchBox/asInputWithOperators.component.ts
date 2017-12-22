import { HttpClient } from '@angular/common/http';
import { NgbDropdown, NgbTypeaheadSelectItemEvent } from '@ng-bootstrap/ng-bootstrap';
import { FilterInterface } from './asFilter.interface';
import { UUID } from 'angular2-uuid';
import { AsComponent } from './as.component';
import { Component, OnInit, Renderer2, ElementRef, OnDestroy, Input, ViewChild, OnChanges, SimpleChanges, ViewContainerRef, ComponentFactoryResolver } from '@angular/core';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/takeLast';
import { AsBoxFilterAbstract } from './asFilter.abstract';
import { Key as KeyBoard} from 'ts-keycode-enum';
import { Observable } from 'rxjs/Observable';
import { AsConfigService } from './asConfig.service';
import { AsSimpleInputWithOperatorsComponent } from './input/asSimpleInputWithOperators.component';
import { AsSuggestionsInputWithOperatorsComponent } from './input/asSuggestionsInputWithOperators.component';
import { AsDomainsInputWithOperatorsComponent } from './input/asDomainsInputWithOperators.component';

export enum OperatorsEnum {
    eq = '=',
    lt = '<',
    le = '\u2264',
    ne = '\u2260',
    gt = '>',
    ge = '\u2265',
    startsWith = '[...',
    endsWith = '...]',
    contains = '[...]'
}

@Component({
    selector: 'as-input-operators',
    template: `
    <div class="input-group">
        <span class="input-group-addon btn-outline-primary">{{viewModel.label}}</span>
        <div ngbDropdown class="input-group-btn" appDropdownNavigation>
            <button class="btn btn-outline-primary" type="button" ngbDropdownToggle #buttonToggle 
            (keydown)="advancedSearchBox.keydown($event, viewModel, {id:'buttonDropDown'})">{{viewModel.value.op ? operatorsEnum[viewModel.value.op] : '..'}}</button>
            <div class="dropdown-menu" ngbDropdownMenu>
                <a class="dropdown-item" (focus)="viewModel.value.op = operator" *ngFor="let operator of operatorsList" 
                (click)="onChangeOperators($event, operator)" (keydown)="onChangeOperators($event, operator)" href="javascript:void(0)">
                    {{operatorsEnum[operator]}}
                </a>
            </div>
        </div>
        <ng-container #inputView></ng-container>
        <span class="input-group-btn">
            <button class="btn btn-outline-primary" type="button" (click)="remove()">X</button>
        </span>
    </div>
    `
})
export class AsInputWithOperatorsComponent extends AsBoxFilterAbstract implements OnInit, OnChanges {

   @ViewChild(NgbDropdown) operatorsDropDownDir: NgbDropdown;
   @ViewChild('buttonToggle') buttonToggleEr: ElementRef;
   @ViewChild('inputView', { read: ViewContainerRef }) inputView;
   public operatorsList;
   public operatorsEnum;
   public inputInstance;

   constructor(
        public advancedSearchBox: AsComponent,
        public renderer: Renderer2,
        public el: ElementRef,
        public _http: HttpClient,
        public _config: AsConfigService,
        protected resolver: ComponentFactoryResolver
    ) {
        super(advancedSearchBox, renderer, el, _http, _config);
        this.operatorsList = [];
        this.operatorsEnum = OperatorsEnum;

    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.viewModel) {
            this.operatorsList = changes.viewModel.currentValue.operators;
        }
    }

    ngOnInit() {
        super.ngOnInit();

        if (!this.viewModel.value) {
            this.viewModel.value = {};
        }

        this.advancedSearchBox.editNext
        .filter((response) => response.viewModel && response.viewModel.uuid === this.viewModel.uuid)
        .subscribe((response) => {
            if (response.options.id && response.options.id === 'buttonDropDown') {
                this.operatorsDropDownDir.close();
                if(this.inputInstance.inputRef.nativeElement){
                    this.inputInstance.inputRef.nativeElement.focus();
                }else{
                    setTimeout(() => {
                        this.inputInstance.inputRef.open();
                        this.inputInstance.focusInput$.next(undefined);
                    },0);
                }
                //this.inputInstance.inputElementRef.nativeElement.focus();
                this.focusInput$.next();
            }else {
                this.advancedSearchBox.nextFilterController(response.viewModel).onFocus('next');
                this.onBlur();
            }
        });

        this.advancedSearchBox.editPrev
        .filter((response) => response.viewModel && response.viewModel.uuid === this.viewModel.uuid)
        .subscribe((response) => {
            if (response.options.id && response.options.id === 'buttonDropDown') {
                this.advancedSearchBox.prevFilterController(response.viewModel).onFocus('prev');
                this.operatorsDropDownDir.close();
                this.buttonToggleEr.nativeElement.blur();
                this.onBlur();
            }else {
                this.operatorsDropDownDir.open();
                this.buttonToggleEr.nativeElement.focus();
            }
        });

        this.advancedSearchBox.searchboxInputClick$.subscribe((response) => {
            this.operatorsDropDownDir.close();
        });

        if(!this.viewModel.suggestions && !this.viewModel.domains){
            const asSimpleInputComponent = this.resolver.resolveComponentFactory(AsSimpleInputWithOperatorsComponent);
            this.inputInstance = this.inputView.createComponent(asSimpleInputComponent).instance;
        }
        if(this.viewModel.suggestions){
            const asDomainsInputComponent = this.resolver.resolveComponentFactory(AsSuggestionsInputWithOperatorsComponent);
            this.inputInstance = this.inputView.createComponent(asDomainsInputComponent).instance;
        }
        if(this.viewModel.domains){
            const asDomainsInputComponent = this.resolver.resolveComponentFactory(AsDomainsInputWithOperatorsComponent);
            this.inputInstance = this.inputView.createComponent(asDomainsInputComponent).instance;
        }

        this.inputInstance._filter = this;
    }
    
    onBlur() {
        super.onBlur();
        this.operatorsDropDownDir.close();
        //setTimeout(()=>{
            this.removeEmpty([this.viewModel.value.value]);
        //},200);
    }

    onFocus(prevNext) {
        if (prevNext === 'prev') {
            if(this.inputInstance.inputRef.nativeElement){
                this.inputInstance.inputRef.nativeElement.focus();
            }else{
                this.inputInstance.inputRef.open();
                this.inputInstance.focusInput$.next(undefined);
            }
        }else {
            setTimeout(()=>{
                this.buttonToggleEr.nativeElement.focus();
                this.operatorsDropDownDir.open();
            });
        }
    }

    onChange() {
        this.viewToModel();
    }

    onChangeOperators($event: MouseEvent | KeyboardEvent, operator: string) {
        const valueEmitted = {
            viewModel: this.viewModel,
            options: {id:'buttonDropDown'}
        };
        if ($event instanceof KeyboardEvent) {
            switch ($event.which) {
                case KeyBoard.Enter:
                // case KeyBoard.Tab:
                    $event.preventDefault();
                    this.viewModel.value.op = operator;
                    this.advancedSearchBox.editNext.next(valueEmitted);
                    
                    if (this.viewModel.value.value) {
                        this.viewToModel();
                    }
            }
        }
        if ($event instanceof MouseEvent) {
            $event.preventDefault();
            $event.stopPropagation();
            this.viewModel.value.op = operator;
            this.advancedSearchBox.editNext.next(valueEmitted);
            
            if (this.viewModel.value.value) {
                this.viewToModel();
            }
        }
    }

    public onSelectDomains(data){
        this.viewModel.value.value = data;
        const valueEmitted = {
            viewModel: this.viewModel,
            options: {}
        };
        this.advancedSearchBox.editNext.next(valueEmitted);
        
        this.viewToModel();
    }

}