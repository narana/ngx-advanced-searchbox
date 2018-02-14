import { NgModel } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { Component, OnDestroy, ViewChild, SimpleChanges, OnChanges } from "@angular/core";
import { AsComponent } from "../as.component";
import { Renderer2, ElementRef, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { AsConfigService } from "../asConfig.service";
import { AsInputAbstract } from "./asInput.abstract";
import { AsBoxFilterAbstract } from "../asFilter.abstract";
import { Subject, SubjectSubscriber } from "rxjs/Subject";
import { AsInputComponent } from "../asInput.component";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/operator/first';
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent } from '@ng-select/ng-select';
import { AfterViewChecked, DoCheck } from '@angular/core';
import { NgControl } from '@angular/forms';

@Component({
    selector:'div[as-domains-input]',
    template: `
    <ng-select 
        appendTo="body"
        [bindLabel]="_filter.viewModel.bindLabel"
        [bindValue]="_filter.viewModel.bindValue"
        (focus)="_filter.focusInput$.next()"
        (keydown)="advancedSearchBox.keydown($event,_filter.viewModel)" 
        #inputRef
        [placeholder]="_filter.viewModel.label"
        [typeahead]="domainTypeahead"
        [items]="itemsDomain"
        (change)="onChange($event)"
        (clear)="onClear()"
        [(ngModel)]="_filter.viewModel.value">
    </ng-select>
    <input autosize #inputAutosize type="text" [(ngModel)]="filterValue" [hidden]="true" />`,
    styles:[`
        ng-select{
            height:100%;
        }
    `]
})
export class AsDomainsInputComponent extends AsInputAbstract implements AfterViewChecked, DoCheck {

    @ViewChild(NgSelectComponent) typeahead;
    @ViewChild('inputAutosize', {read: ElementRef}) inputAutosize:ElementRef;
    @ViewChild('inputRef', {read: NgControl}) ngControl:NgControl;
    
    private _filterValue = '';
    set filterValue(val){
        this._filterValue = val;
    }
    get filterValue(){
        return this._filterValue;
    }
    
    constructor(
        public advancedSearchBox: AsComponent,
        protected _http: HttpClient,
        protected _config: AsConfigService,
        public _element: ElementRef
    ) {
        super(advancedSearchBox, _http, _config, _element);
    }

    ngOnInit(){
        super.ngOnInit();
        this.ngControl.valueChanges.subscribe((res)=>{
            if(res === '' || res === undefined || res === null){
            }else{
                if(this._filter.viewModel.bindLabel){
                    this.filterValue = res[this._filter.viewModel.bindLabel];
                }else{
                    this.filterValue = res;
                }
            }
        });
    }

    ngDoCheck(){
        if(this.typeahead.filterValue){
            this._filterValue = this.typeahead.filterValue;
        }
    }

    ngAfterViewChecked(){
        this.inputElementRef.nativeElement.style.width = 'calc('+this.inputAutosize.nativeElement.style.width + ' + 50px)';
    }

    onClear(){
        this._filterValue = null;
        this.focusInput$.next(undefined);
        this._filter.remove();
        //this._filter.viewToModel();
    }

    onChange(data){
        // without timeout it is execute before keydown event
        setTimeout(()=>{
            if(data === '' || data === undefined || data === null){
                this.focusInput$.next(undefined);
                this.inputRef.open();
                this._filter.removeEmpty([this._filter.viewModel.value]);
            }else{
                if(this._filter.viewModel.bindLabel){
                    this._filterValue = data[this._filter.viewModel.bindLabel];
                }else{
                    this._filterValue = data;
                }
    
                if(this._filter.viewModel.bindValue){
                    this._filter.onSelectDomains(data[this._filter.viewModel.bindValue]);
                }else{
                    this._filter.onSelectDomains(data);
                }
            }
        },0);
    }
}