import { Component, OnDestroy, OnInit, ElementRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { PlanillaTotal } from 'src/app/interfaces/planilla-total';
import * as XLSX from 'xlsx';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-boletaspago',
  templateUrl: './boletaspago.component.html',
  styleUrls: ['./boletaspago.component.scss']
})
export class BoletaspagoComponent implements OnInit, OnDestroy {
  dtOptions: DataTables.Settings = {};
  dtTrigger = new Subject();
  data: PlanillaTotal | any;
  name: string = '...';
  myqrcode: any;
  constructor(private http: HttpClient) { }
  ngOnInit(): void {
    this.dtOptions = {
      pagingType: 'full_numbers',
      pageLength: 10,
      language: {
        url: '//cdn.datatables.net/plug-ins/1.10.25/i18n/Spanish.json'
      }
    };
  }
  ngOnDestroy(): void {
    this.dtTrigger.unsubscribe();
  }
  async onFileChange(event: any) {
    this.name = (event.target.files[0].name).split('.')[0];
    const target: DataTransfer = await <DataTransfer>(event.target);
    if (target.files.length !== 1) throw new Error('Cannot use multiple files');
    const reader: FileReader = new FileReader();
    reader.readAsBinaryString(target.files[0]);
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];
      this.data = XLSX.utils.sheet_to_json(ws, { header: 0 }); //let jsonObj = XLSX.utils.sheet_to_json(worksheet, {raw: false});
      this.dtTrigger.next();
      let tabla1: any = [];
      let auxError = 0;;
      this.data.forEach((element: any) => {
        if (element.CI) {
          tabla1.push(element);
          if (element['N°'] === 0) {
            auxError++;
          }
        }
      });
      if (auxError !== 0) {
        alert(`ADVERTENCIA, Se encontraron ${auxError} errores!!!`);
      }
      this.data = tabla1; //console.table(this.data[0]);
    };
  }

  genpdfOne(element: any) {
    let PDF = new jsPDF('p', 'mm', 'a4');
    //let i = 0;
      this.myqrcode = '';
      let sexo = (element.SEXO === 'M') ? 'MASCULINO' : 'FEMENINO';
      let emp = (element.SEXO === 'M') ? 'DEL TRABAJADOR' : 'DE LA TRABAJADORA';
      PDF.setFontSize(10);
      PDF.setFont("times", 'bold');
      PDF.setTextColor(0, 0, 80);
      PDF.text('SEGURO SOCIAL UNIVERSITARIO', 110, 20, { align: 'center' });
      PDF.text('POTOSÍ', 110, 24, { align: 'center' });
      PDF.setTextColor(184, 15, 10);
      PDF.setFontSize(14);
      PDF.text(`BOLETA DE PAGO DE ${this.name}`, 110, 28, { align: 'center' });
      PDF.setFontSize(10);
      autoTable(PDF, {
        startY: 29,
        margin: { top: 16, left: 26, right: 10, bottom: 10 },
        styles: {
          overflow: 'visible',
          fontSize: 6.25
        },
        bodyStyles: { lineColor: [189, 0, 199] },
        theme: 'striped', //|'grid'|'plain'|'css' = 'striped'
        head: [
          [{ content: `DATOS DE LA EMPRESA`, colSpan: 6, styles: { halign: 'left' } }],
        ],
        body: [
          [
            { content: `RAZON SOCIAL :` },
            { content: `SEGURO SOCIAL UNIVERSITARIO POTOSÍ` },
            { content: `N.I.T. :` },
            { content: `1023877026` }
          ],
          [
            { content: `DIRECCIÓN :` },
            { content: `CALLE CALAMA N° : 107` },
            { content: `TELEFONO` },
            { content: `+591-2-6223227` }
          ],
        ]
      });
      autoTable(PDF, {
        margin: { top: 10, left: 26, right: 10, bottom: 10 },
        startY: 46,
        styles: { //overflow: 'visible',
          fontSize: 6.25
        },
        bodyStyles: { lineColor: [189, 195, 199] },
        theme: 'striped', //|'grid'|'plain'|'css' = 'striped'
        head: [
          [{ content: `DATOS ${emp}`, colSpan: 6, styles: { halign: 'left' } }],
        ],
        body: [
          [
            { content: `NOMBRE COMPLETO :` },
            { content: `${element['NOMBRES Y APELLIDOS']}` },
            { content: `C.I. :` },
            { content: `${element.CI}` },
            { content: `NACIONALIDAD :` },
            { content: `${element.NACIONALIDAD}` },
            
          ],
          [
            { content: `CARGO :` },
            { content: `${element.CARGO}` },
            { content: `GENERO :` },
            { content: `${sexo}` },
            { content: `DIAS TRAB :` },
            { content: `${element['DIAS TRAB']}` }
          ]
        ]
      });
      autoTable(PDF, {
        margin: { top: 10, left: 26, right: 10, bottom: 10 },
        startY: 62,
        styles: {
          overflow: 'visible',
          fontSize: 6.25
        },
        bodyStyles: { lineColor: [189, 195, 199] },
        theme: 'grid', //|'grid'|'plain'|'css' = 'striped'
        head: [
          [{ content: `DATOS ${emp} VINCULADOS A LA RELACIÓN LABORAL`, colSpan: 6, styles: { halign: 'left' } }],
        ],
        body: [
          [
            { content: `INGRESOS`, colSpan: 3, styles: { halign: 'center', cellPadding: 0.5, } },
            { content: `DESCUENTOS`, colSpan: 3, styles: { halign: 'center', cellPadding: 0.5, } }
          ],
          [
            { content: `1`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `HABER BÁSICO`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['HABER BASICO'] !== 0) ? element['HABER BASICO'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `1`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `A.F.P. `, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element.AFP !== 0) ? element.AFP.toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],
          [
            { content: `2`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `BONO DE ANTIGÜEDAD`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['BONO ANTIGÜE'] !== 0) ? element['BONO ANTIGÜE'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `2`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `RC-IVA`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element.RCIVA !== 0) ? element.RCIVA.toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],
          [
            { content: `3`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `BONO DE RIESGO`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['BONO DE RIESGO'] !== 0) ? element['BONO DE RIESGO'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `3`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `PRO TRABAJADORES `, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['PRO TRABA'] !== 0) ? element['PRO TRABA'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],
          [
            { content: `4`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `ESCALAFON MÉDICO`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['ESCALAF MEDICO'] !== 0) ? element['ESCALAF MEDICO'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `4`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `APORTE SINDICAL`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['APORT. SINDICAL'] !== 0) ? element['APORT. SINDICAL'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],
          [
            { content: `5`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `CATEGORÍA`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['CATEG. MEDICA'] !== 0) ? element['CATEG. MEDICA'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `5`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `MULTAS`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['MULTAS POR ATRASOS Y OTROS'] !== 0) ? element['MULTAS POR ATRASOS Y OTROS'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],
          [
            { content: `6`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `COMP. DOM. Y FERIADOS`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['COMP. DOM-FER'] !== 0) ? element['COMP. DOM-FER'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `6`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `COOPERATIVA`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['COOPERATIVA 18 DE JULIO'] !== 0) ? element['COOPERATIVA 18 DE JULIO'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],
          [
            { content: `7`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `COMP. NOCTURNOS`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['COMP. NOCTUR'] !== 0) ? element['COMP. NOCTUR'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `7`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `FEDERACION`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['FEDERACION NACIONAL'] !== 0) ? element['FEDERACION NACIONAL'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],
          [
            { content: `8`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `SALDO A FAVOR RC-IVA`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['SALDO FACT'] !== 0) ? element['SALDO FACT'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `8`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `DEUDORES VARIOS`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['DEUDORES VARIOS'] !== 0) ? element['DEUDORES VARIOS'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],
          [
            { content: ``, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: ``, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: ``, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `9`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `COMITE CIENTÍFICO`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['COMITE CIENTIFICO'] !== 0) ? element['COMITE CIENTIFICO'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],
          [
            { content: ``, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: ``, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: ``, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `10`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `SINDICATO`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['SINDICATO'] !== 0) ? element['SINDICATO'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],
          [
            { content: `TOTAL GANADO`, colSpan: 2, styles: { halign: 'center' } },
            { content: `${(element['TOTAL GANADO'] !== 0) ? element['TOTAL GANADO'].toLocaleString("en-US") : '0.00'}`, styles: { font: 'bold', halign: 'right' } },

            { content: `TOTAL DESCUENTOS`, colSpan: 2, styles: { halign: 'center' } },
            { content: `${(element['TOTAL DESCUEN'] !== 0) ? element['TOTAL DESCUEN'].toLocaleString("en-US") : '0.00'}`, styles: { font: 'bold', halign: 'right' } },
          ],
          [
            { content: `LIQUIDO PAGABLE ${(element['LIQUIDO PAGABLE'] !== 0) ? element['LIQUIDO PAGABLE'].toLocaleString("en-US") : '0.00'}`, colSpan: 6, styles: { halign: 'center' } }
          ]
        ]
      });
      PDF.addImage('../../../assets/escudo.png', 77, 40, 64, 64, 'logo', 'NONE');
      PDF.setFont("times", 'bold');
      PDF.setTextColor(0, 0, 0);
      PDF.setFontSize(7);
      PDF.text(`${element['NOMBRES Y APELLIDOS']}`, 110, 137, { align: 'center' });
      PDF.setTextColor(0, 0, 50);
      PDF.setFontSize(9.5);
      PDF.text('FIRMA', 110, 140, { align: 'center' });
      PDF.setFont("times", 'bold'); //this.myqrcode = element['NOMBRES Y APELLIDOS'];
      /*i++;
      if (i % 2 == 0) {
        PDF.addPage();
        i = 0;
      }*/

      this.myqrcode = '';
      PDF.setFontSize(10);
      PDF.setFont("times", 'bold');
      PDF.setTextColor(0, 0, 80);
      PDF.text('SEGURO SOCIAL UNIVERSITARIO', 110, 160, { align: 'center' });
      PDF.text('POTOSÍ', 110, 164, { align: 'center' });
      PDF.setTextColor(184, 15, 10);
      PDF.setFontSize(14);
      PDF.text(`BOLETA DE PAGO DE ${this.name}`, 110, 168, { align: 'center' });
      PDF.setFontSize(10);
      autoTable(PDF, {
        startY: 169,
        margin: { top: 16, left: 26, right: 10, bottom: 10 },
        styles: {
          overflow: 'visible',
          fontSize: 6.25
        },
        bodyStyles: { lineColor: [189, 0, 199] },
        theme: 'striped', //|'grid'|'plain'|'css' = 'striped'
        head: [
          [{ content: `DATOS DE LA EMPRESA`, colSpan: 6, styles: { halign: 'left' } }],
        ],
        body: [
          [
            { content: `RAZON SOCIAL :` },
            { content: `SEGURO SOCIAL UNIVERSITARIO POTOSÍ` },
            { content: `N.I.T. :` },
            { content: `1023877026` }
          ],
          [
            { content: `DIRECCIÓN :` },
            { content: `CALLE CALAMA N° : 107` },
            { content: `TELEFONO` },
            { content: `+591-2-6223227` }
          ],
        ]
      });
      autoTable(PDF, {
        margin: { top: 10, left: 26, right: 10, bottom: 10 },
        startY: 186,
        styles: { //overflow: 'visible',
          fontSize: 6.25
        },
        bodyStyles: { lineColor: [189, 195, 199] },
        theme: 'striped', //|'grid'|'plain'|'css' = 'striped'
        head: [
          [{ content: `DATOS ${emp}`, colSpan: 6, styles: { halign: 'left' } }],
        ],
        body: [
          [
            { content: `NOMBRE COMPLETO :` },
            { content: `${element['NOMBRES Y APELLIDOS']}` },
            { content: `C.I. :` },
            { content: `${element.CI}` },
            { content: `NACIONALIDAD :` },
            { content: `${element.NACIONALIDAD}` }
          ],
          [
            { content: `CARGO :` },
            { content: `${element.CARGO}` },
            { content: `GENERO :` },
            { content: `${sexo}` },
            { content: `DIAS TRAB :` },
            { content: `${element['DIAS TRAB']}` }
          ]
        ]
      });
      autoTable(PDF, {
        margin: { top: 10, left: 26, right: 10, bottom: 10 },
        startY: 202,
        styles: {
          overflow: 'visible',
          fontSize: 6.25
        },
        bodyStyles: { lineColor: [189, 195, 199] },
        theme: 'grid', //|'grid'|'plain'|'css' = 'striped'
        head: [
          [{ content: `DATOS ${emp} VINCULADOS A LA RELACIÓN LABORAL`, colSpan: 6, styles: { halign: 'left' } }],
        ],
        body: [
          [
            { content: `INGRESOS`, colSpan: 3, styles: { halign: 'center', cellPadding: 0.5, } },
            { content: `DESCUENTOS`, colSpan: 3, styles: { halign: 'center', cellPadding: 0.5, } }
          ],
          [
            { content: `1`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `HABER BÁSICO`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['HABER BASICO'] !== 0) ? element['HABER BASICO'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `1`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `A.F.P. `, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element.AFP !== 0) ? element.AFP.toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],
          [
            { content: `2`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `BONO DE ANTIGÜEDAD`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['BONO ANTIGÜE'] !== 0) ? element['BONO ANTIGÜE'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `2`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `RC-IVA`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element.RCIVA !== 0) ? element.RCIVA.toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],
          [
            { content: `3`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `BONO DE RIESGO`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['BONO DE RIESGO'] !== 0) ? element['BONO DE RIESGO'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `3`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `PRO TRABAJADORES `, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['PRO TRABA'] !== 0) ? element['PRO TRABA'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],
          [
            { content: `4`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `ESCALAFON MÉDICO`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['ESCALAF MEDICO'] !== 0) ? element['ESCALAF MEDICO'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `4`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `APORTE SINDICAL`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['APORT. SINDICAL'] !== 0) ? element['APORT. SINDICAL'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],
          [
            { content: `5`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `CATEGORÍA`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['CATEG. MEDICA'] !== 0) ? element['CATEG. MEDICA'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `5`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `MULTAS`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['MULTAS POR ATRASOS Y OTROS'] !== 0) ? element['MULTAS POR ATRASOS Y OTROS'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],
          [
            { content: `6`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `COMP. DOM. Y FERIADOS`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['COMP. DOM-FER'] !== 0) ? element['COMP. DOM-FER'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `6`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `COOPERATIVA`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['COOPERATIVA 18 DE JULIO'] !== 0) ? element['COOPERATIVA 18 DE JULIO'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],
          [
            { content: `7`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `COMP. NOCTURNOS`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['COMP. NOCTUR'] !== 0) ? element['COMP. NOCTUR'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `7`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `FEDERACION`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['FEDERACION NACIONAL'] !== 0) ? element['FEDERACION NACIONAL'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],
          [
            { content: `8`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `SALDO A FAVOR RC-IVA`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['SALDO FACT'] !== 0) ? element['SALDO FACT'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `8`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `DEUDORES VARIOS`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['DEUDORES VARIOS'] !== 0) ? element['DEUDORES VARIOS'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],

          [
            { content: ``, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: ``, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: ``, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `9`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `COMITE CIENTÍFICO`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['COMITE CIENTIFICO'] !== 0) ? element['COMITE CIENTIFICO'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],
          [
            { content: ``, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: ``, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: ``, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `10`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `SINDICATO`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['SINDICATO'] !== 0) ? element['SINDICATO'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],
          
          [
            { content: `TOTAL GANADO`, colSpan: 2, styles: { halign: 'center' } },
            { content: `${(element['TOTAL GANADO'] !== 0) ? element['TOTAL GANADO'].toLocaleString("en-US") : '0.00'}`, styles: { font: 'bold', halign: 'right' } },

            { content: `TOTAL DESCUENTOS`, colSpan: 2, styles: { halign: 'center' } },
            { content: `${(element['TOTAL DESCUEN'] !== 0) ? element['TOTAL DESCUEN'].toLocaleString("en-US") : '0.00'}`, styles: { font: 'bold', halign: 'right' } },
          ],
          [
            { content: `LIQUIDO PAGABLE ${(element['LIQUIDO PAGABLE'] !== 0) ? element['LIQUIDO PAGABLE'].toLocaleString("en-US") : '0.00'}`, colSpan: 6, styles: { halign: 'center' } }
          ]
        ]
      });
      PDF.addImage('../../../assets/escudo.png', 77, 180, 64, 64, 'logo', 'NONE');
      //PDF.setFont("times", 'bold');
      //PDF.setTextColor(0, 0, 0);
      //PDF.setFontSize(7);
      //PDF.text(`${element['NOMBRES Y APELLIDOS']}`, 110, 277, { align: 'center' });
      //PDF.setTextColor(0, 0, 50);
      //PDF.setFontSize(9.5);
//      PDF.text('FIRMA', 110, 280, { align: 'center' });
      //PDF.setFont("times", 'bold'); //this.myqrcode = element['NOMBRES Y APELLIDOS'];
    PDF.save(element['NOMBRES Y APELLIDOS'] + '.pdf');
  }
  /////////////////////////////TODOS/////////////////////////////
  genpdfAll() {
    let PDF = new jsPDF('p', 'mm', 'a4');
    //let i = 0;
    this.data.forEach((element: any) => {
      this.myqrcode = '';
      let sexo = (element.SEXO === 'M') ? 'MASCULINO' : 'FEMENINO';
      let emp = (element.SEXO === 'M') ? 'DEL TRABAJADOR' : 'DE LA TRABAJADORA';
      PDF.setFontSize(10);
      PDF.setFont("times", 'bold');
      PDF.setTextColor(0, 0, 80);
      PDF.text('SEGURO SOCIAL UNIVERSITARIO', 110, 20, { align: 'center' });
      PDF.text('POTOSÍ', 110, 24, { align: 'center' });
      PDF.setTextColor(184, 15, 10);
      PDF.setFontSize(14);
      PDF.text(`BOLETA DE PAGO DE ${this.name}`, 110, 28, { align: 'center' });
      PDF.setFontSize(10);
      autoTable(PDF, {
        startY: 29,
        margin: { top: 16, left: 26, right: 10, bottom: 10 },
        styles: {
          overflow: 'visible',
          fontSize: 6.25
        },
        bodyStyles: { lineColor: [189, 0, 199] },
        theme: 'striped', //|'grid'|'plain'|'css' = 'striped'
        head: [
          [{ content: `DATOS DE LA EMPRESA`, colSpan: 6, styles: { halign: 'left' } }],
        ],
        body: [
          [
            { content: `RAZON SOCIAL :` },
            { content: `SEGURO SOCIAL UNIVERSITARIO POTOSÍ` },
            { content: `N.I.T. :` },
            { content: `1023877026` }
          ],
          [
            { content: `DIRECCIÓN :` },
            { content: `CALLE CALAMA N° : 107` },
            { content: `TELEFONO` },
            { content: `+591-2-6223227` }
          ],
        ]
      });
      autoTable(PDF, {
        margin: { top: 10, left: 26, right: 10, bottom: 10 },
        startY: 46,
        styles: { //overflow: 'visible',
          fontSize: 6.25
        },
        bodyStyles: { lineColor: [189, 195, 199] },
        theme: 'striped', //|'grid'|'plain'|'css' = 'striped'
        head: [
          [{ content: `DATOS ${emp}`, colSpan: 8, styles: { halign: 'left' } }],
        ],
        body: [
          [
            { content: `NOMBRE COMPLETO :` },
            { content: `${element['NOMBRES Y APELLIDOS']}` },
            { content: `C.I. :` },
            { content: `${element.CI}` },
            { content: `NACIONALIDAD :` },
            { content: `${element.NACIONALIDAD}` }
          ],
          [
            { content: `CARGO :` },
            { content: `${element.CARGO}` },
            { content: `GENERO :` },
            { content: `${sexo}` },
            { content: `DIAS TRAB :` },
            { content: `${element['DIAS TRAB']}` }
          ]
        ]
      });
      autoTable(PDF, {
        margin: { top: 10, left: 26, right: 10, bottom: 10 },
        startY: 62,
        styles: {
          overflow: 'visible',
          fontSize: 6.25
        },
        bodyStyles: { lineColor: [189, 195, 199] },
        theme: 'grid', //|'grid'|'plain'|'css' = 'striped'
        head: [
          [{ content: `DATOS ${emp} VINCULADOS A LA RELACIÓN LABORAL`, colSpan: 6, styles: { halign: 'left' } }],
        ],
        body: [
          [
            { content: `INGRESOS`, colSpan: 3, styles: { halign: 'center', cellPadding: 0.5, } },
            { content: `DESCUENTOS`, colSpan: 3, styles: { halign: 'center', cellPadding: 0.5, } }
          ],
          [
            { content: `1`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `HABER BÁSICO`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['HABER BASICO'] !== 0) ? element['HABER BASICO'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `1`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `A.F.P. `, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element.AFP !== 0) ? element.AFP.toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],
          [
            { content: `2`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `BONO DE ANTIGÜEDAD`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['BONO ANTIGÜE'] !== 0) ? element['BONO ANTIGÜE'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `2`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `RC-IVA`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element.RCIVA !== 0) ? element.RCIVA.toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],
          [
            { content: `3`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `BONO DE RIESGO`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['BONO DE RIESGO'] !== 0) ? element['BONO DE RIESGO'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `3`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `PRO TRABAJADORES `, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['PRO TRABA'] !== 0) ? element['PRO TRABA'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],
          [
            { content: `4`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `ESCALAFON MÉDICO`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['ESCALAF MEDICO'] !== 0) ? element['ESCALAF MEDICO'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `4`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `APORTE SINDICAL`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['APORT. SINDICAL'] !== 0) ? element['APORT. SINDICAL'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],
          [
            { content: `5`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `CATEGORÍA`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['CATEG. MEDICA'] !== 0) ? element['CATEG. MEDICA'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `5`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `MULTAS`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['MULTAS POR ATRASOS Y OTROS'] !== 0) ? element['MULTAS POR ATRASOS Y OTROS'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],
          [
            { content: `6`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `COMP. DOM. Y FERIADOS`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['COMP. DOM-FER'] !== 0) ? element['COMP. DOM-FER'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `6`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `COOPERATIVA`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['COOPERATIVA 18 DE JULIO'] !== 0) ? element['COOPERATIVA 18 DE JULIO'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],
          [
            { content: `7`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `COMP. NOCTURNOS`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['COMP. NOCTUR'] !== 0) ? element['COMP. NOCTUR'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `7`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `FEDERACION`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['FEDERACION NACIONAL'] !== 0) ? element['FEDERACION NACIONAL'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],
          [
            { content: `8`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `SALDO A FAVOR RC-IVA`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['SALDO FACT'] !== 0) ? element['SALDO FACT'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `8`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `DEUDORES VARIOS`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['DEUDORES VARIOS'] !== 0) ? element['DEUDORES VARIOS'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],
          [
            { content: ``, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: ``, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: ``, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `9`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `COMITE CIENTÍFICO`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['COMITE CIENTIFICO'] !== 0) ? element['COMITE CIENTIFICO'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],
          [
            { content: ``, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: ``, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: ``, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `10`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `SINDICATO`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['SINDICATO'] !== 0) ? element['SINDICATO'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],
          [
            { content: `TOTAL GANADO`, colSpan: 2, styles: { halign: 'center' } },
            { content: `${(element['TOTAL GANADO'] !== 0) ? element['TOTAL GANADO'].toLocaleString("en-US") : '0.00'}`, styles: { font: 'bold', halign: 'right' } },

            { content: `TOTAL DESCUENTOS`, colSpan: 2, styles: { halign: 'center' } },
            { content: `${(element['TOTAL DESCUEN'] !== 0) ? element['TOTAL DESCUEN'].toLocaleString("en-US") : '0.00'}`, styles: { font: 'bold', halign: 'right' } },
          ],
          [
            { content: `LIQUIDO PAGABLE ${(element['LIQUIDO PAGABLE'] !== 0) ? element['LIQUIDO PAGABLE'].toLocaleString("en-US") : '0.00'}`, colSpan: 6, styles: { halign: 'center' } }
          ]
        ]
      });
      PDF.addImage('../../../assets/escudo.png', 77, 40, 64, 64, 'logo', 'NONE');
      PDF.setFont("times", 'bold');
      PDF.setTextColor(0, 0, 0);
      PDF.setFontSize(7);
      PDF.text(`${element['NOMBRES Y APELLIDOS']}`, 110, 137, { align: 'center' });
      PDF.setTextColor(0, 0, 50);
      PDF.setFontSize(9.5);
      PDF.text('FIRMA', 110, 140, { align: 'center' });
      PDF.setFont("times", 'bold'); //this.myqrcode = element['NOMBRES Y APELLIDOS'];
      /*i++;
      if (i % 2 == 0) {
        PDF.addPage();
        i = 0;
      }*/

      this.myqrcode = '';
      PDF.setFontSize(10);
      PDF.setFont("times", 'bold');
      PDF.setTextColor(0, 0, 80);
      PDF.text('SEGURO SOCIAL UNIVERSITARIO', 110, 160, { align: 'center' });
      PDF.text('POTOSÍ', 110, 164, { align: 'center' });
      PDF.setTextColor(184, 15, 10);
      PDF.setFontSize(14);
      PDF.text(`BOLETA DE PAGO DE ${this.name}`, 110, 168, { align: 'center' });
      PDF.setFontSize(10);
      autoTable(PDF, {
        startY: 169,
        margin: { top: 16, left: 26, right: 10, bottom: 10 },
        styles: {
          overflow: 'visible',
          fontSize: 6.25
        },
        bodyStyles: { lineColor: [189, 0, 199] },
        theme: 'striped', //|'grid'|'plain'|'css' = 'striped'
        head: [
          [{ content: `DATOS DE LA EMPRESA`, colSpan: 6, styles: { halign: 'left' } }],
        ],
        body: [
          [
            { content: `RAZON SOCIAL :` },
            { content: `SEGURO SOCIAL UNIVERSITARIO POTOSÍ` },
            { content: `N.I.T. :` },
            { content: `1023877026` }
          ],
          [
            { content: `DIRECCIÓN :` },
            { content: `CALLE CALAMA N° : 107` },
            { content: `TELEFONO` },
            { content: `+591-2-6223227` }
          ],
        ]
      });
      autoTable(PDF, {
        margin: { top: 10, left: 26, right: 10, bottom: 10 },
        startY: 186,
        styles: { //overflow: 'visible',
          fontSize: 6.25
        },
        bodyStyles: { lineColor: [189, 195, 199] },
        theme: 'striped', //|'grid'|'plain'|'css' = 'striped'
        head: [
          [{ content: `DATOS ${emp}`, colSpan: 6, styles: { halign: 'left' } }],
        ],
        body: [
          [
            { content: `NOMBRE COMPLETO :` },
            { content: `${element['NOMBRES Y APELLIDOS']}` },
            { content: `C.I. :` },
            { content: `${element.CI}` },
            { content: `NACIONALIDAD :` },
            { content: `${element.NACIONALIDAD}` }
          ],
          [
            { content: `CARGO :` },
            { content: `${element.CARGO}` },
            { content: `GENERO :` },
            { content: `${sexo}` },
            { content: `DIAS TRAB :` },
            { content: `${element['DIAS TRAB']}` }
          ]
        ]
      });
      autoTable(PDF, {
        margin: { top: 10, left: 26, right: 10, bottom: 10 },
        startY: 202,
        styles: {
          overflow: 'visible',
          fontSize: 6.25
        },
        bodyStyles: { lineColor: [189, 195, 199] },
        theme: 'grid', //|'grid'|'plain'|'css' = 'striped'
        head: [
          [{ content: `DATOS ${emp} VINCULADOS A LA RELACIÓN LABORAL`, colSpan: 6, styles: { halign: 'left' } }],
        ],
        body: [
          [
            { content: `INGRESOS`, colSpan: 3, styles: { halign: 'center', cellPadding: 0.5, } },
            { content: `DESCUENTOS`, colSpan: 3, styles: { halign: 'center', cellPadding: 0.5, } }
          ],
          [
            { content: `1`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `HABER BÁSICO`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['HABER BASICO'] !== 0) ? element['HABER BASICO'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `1`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `A.F.P. `, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element.AFP !== 0) ? element.AFP.toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],
          [
            { content: `2`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `BONO DE ANTIGÜEDAD`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['BONO ANTIGÜE'] !== 0) ? element['BONO ANTIGÜE'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `2`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `RC-IVA`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element.RCIVA !== 0) ? element.RCIVA.toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],
          [
            { content: `3`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `BONO DE RIESGO`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['BONO DE RIESGO'] !== 0) ? element['BONO DE RIESGO'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `3`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `PRO TRABAJADORES `, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['PRO TRABA'] !== 0) ? element['PRO TRABA'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],
          [
            { content: `4`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `ESCALAFON MÉDICO`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['ESCALAF MEDICO'] !== 0) ? element['ESCALAF MEDICO'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `4`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `APORTE SINDICAL`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['APORT. SINDICAL'] !== 0) ? element['APORT. SINDICAL'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],
          [
            { content: `5`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `CATEGORÍA`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['CATEG. MEDICA'] !== 0) ? element['CATEG. MEDICA'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `5`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `MULTAS`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['MULTAS POR ATRASOS Y OTROS'] !== 0) ? element['MULTAS POR ATRASOS Y OTROS'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],
          [
            { content: `6`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `COMP. DOM. Y FERIADOS`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['COMP. DOM-FER'] !== 0) ? element['COMP. DOM-FER'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `6`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `COOPERATIVA`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['COOPERATIVA 18 DE JULIO'] !== 0) ? element['COOPERATIVA 18 DE JULIO'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],
          [
            { content: `7`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `COMP. NOCTURNOS`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['COMP. NOCTUR'] !== 0) ? element['COMP. NOCTUR'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `7`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `FEDERACION`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['FEDERACION NACIONAL'] !== 0) ? element['FEDERACION NACIONAL'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],
          [
            { content: `8`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `SALDO A FAVOR RC-IVA`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['SALDO FACT'] !== 0) ? element['SALDO FACT'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `8`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `DEUDORES VARIOS`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['DEUDORES VARIOS'] !== 0) ? element['DEUDORES VARIOS'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],
          [
            { content: ``, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: ``, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: ``, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `9`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `COMITE CIENTÍFICO`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['COMITE CIENTIFICO'] !== 0) ? element['COMITE CIENTIFICO'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],
          [
            { content: ``, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: ``, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: ``, styles: { halign: 'right', cellPadding: 0.5, } },

            { content: `10`, styles: { halign: 'right', cellPadding: 0.5, } },
            { content: `SINDICATO`, styles: { halign: 'left', cellPadding: 0.5, } },
            { content: `${(element['SINDICATO'] !== 0) ? element['SINDICATO'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right', cellPadding: 0.5, } },
          ],
          [
            { content: `TOTAL GANADO`, colSpan: 2, styles: { halign: 'center' } },
            { content: `${(element['TOTAL GANADO'] !== 0) ? element['TOTAL GANADO'].toLocaleString("en-US") : '0.00'}`, styles: { font: 'bold', halign: 'right' } },

            { content: `TOTAL DESCUENTOS`, colSpan: 2, styles: { halign: 'center' } },
            { content: `${(element['TOTAL DESCUEN'] !== 0) ? element['TOTAL DESCUEN'].toLocaleString("en-US") : '0.00'}`, styles: { font: 'bold', halign: 'right' } },
          ],
          [
            { content: `LIQUIDO PAGABLE ${(element['LIQUIDO PAGABLE'] !== 0) ? element['LIQUIDO PAGABLE'].toLocaleString("en-US") : '0.00'}`, colSpan: 6, styles: { halign: 'center' } }
          ]
        ]
      });
      PDF.addImage('../../../assets/escudo.png', 77, 180, 64, 64, 'logo', 'NONE');
      //PDF.setFont("times", 'bold');
      //PDF.setTextColor(0, 0, 0);
      //PDF.setFontSize(7);
      //PDF.text(`${element['NOMBRES Y APELLIDOS']}`, 110, 277, { align: 'center' });
      //PDF.setTextColor(0, 0, 50);
      //PDF.setFontSize(9.5);
//      PDF.text('FIRMA', 110, 280, { align: 'center' });
      //PDF.setFont("times", 'bold'); //this.myqrcode = element['NOMBRES Y APELLIDOS'];
      PDF.addPage();
    });
    PDF.save(this.name + '.pdf');
  }
  /*genpdfAll0() {
    let PDF = new jsPDF('p', 'mm', 'a4');
    let i = 0;
    this.data.forEach((element: any) => {
      / ** INI IZQUIERDO ** /
      PDF.setFontSize(10);
      PDF.setFont("times", 'bold');
      PDF.setTextColor(0, 0, 80);
      //PDF.text('SEGURO SOCIAL UNIVERSITARIO', 53, 13, { align: 'center' });
      PDF.text('SEGURO SOCIAL UNIVERSITARIO', 53, 13 + i * 140, { align: 'center' });
      PDF.addImage('../../../assets/escudo.png', 10, 10 + i * 140, 13, 13, 'logo', 'NONE');
      PDF.text('POTOSÍ', 53, 17 + i * 140, { align: 'center' });
      //PDF.addImage('../../../assets/logo.png', 16, 40 + i * 140, 64, 64, 'logo', 'MEDIUM');
      PDF.setTextColor(99, 0, 0);
      PDF.setFontSize(12);
      PDF.text(this.name, 50, 22 + i * 140, { align: 'center' });
      PDF.setTextColor(0, 0, 8);
      PDF.setFontSize(9.5);
      PDF.text('ITEM: ' + element['N°'] + '   NOMBRES: ' + element['NOMBRES Y APELLIDOS'], 10, 27 + i * 140, { align: 'left' });
      PDF.text('D. TRAB.: ' + element['DIAS TRAB'] + ' CARGO: ' + element.CARGO, 10, 31 + i * 140, { align: 'left' });
      PDF.setFontSize(10);
      PDF.text('INGRESOS', 10, 37 + i * 140, { align: 'left' });
        PDF.setFontSize(9);
        PDF.text('HABER BASICO :', 15, 41 + i * 140, { align: 'left' });
        PDF.text(element['HABER BASICO'].toLocaleString("en-US"), 90, 41 + i * 140, { align: 'right' });
        PDF.text('BONO DE ANTIGÜEDAD :', 15, 45 + i * 140, { align: 'left' });
        PDF.text((element['BONO ANTIGÜE']!==0)?element['BONO ANTIGÜE'].toLocaleString("en-US"):'0.00', 90, 45 + i * 140, { align: 'right' });
        PDF.text('BONO DE RIESGO :', 15, 49 + i * 140, { align: 'left' });
        PDF.text((element['BONO DE RIESGO']!==0)?element['BONO DE RIESGO'].toLocaleString("en-US"):'0.00', 90, 49 + i * 140, { align: 'right' });
        PDF.text('ESCALAFON MÉDICO :', 15, 53 + i * 140, { align: 'left' });
        PDF.text((element['ESCALAF MEDICO']!==0)?element['ESCALAF MEDICO'].toLocaleString("en-US"):'0.00', 90, 53 + i * 140, { align: 'right' });
        PDF.text('CATEGORÍA :', 15, 57 + i * 140, { align: 'left' });
        PDF.text((element['CATEG. MEDICA']!==0)?element['CATEG. MEDICA'].toLocaleString("en-US"):'0.00', 90, 57 + i * 140, { align: 'right' });
        PDF.text('COMP. DOM. Y FERIADOS :', 15, 61 + i * 140, { align: 'left' });
        PDF.text((element['COMP. DOM-FER']!==0)?element['COMP. DOM-FER'].toLocaleString("en-US"):'0.00', 90, 61 + i * 140, { align: 'right' });
        PDF.text('COMP. NOCTURNOS :', 15, 65 + i * 140, { align: 'left' });
        PDF.text((element['COMP. NOCTUR']!==0)?element['COMP. NOCTUR'].toLocaleString("en-US"):'0.00', 90, 65 + i * 140, { align: 'right' });
        PDF.text('TOTAL GANADO', 10, 70 + i * 140, { align: 'left' });
        PDF.text((element['TOTAL GANADO']!==0)?element['TOTAL GANADO'].toLocaleString("en-US"):'0.00', 90, 70 + i * 140, { align: 'right' });
      PDF.text('DESCUENTOS', 10, 75 + i * 140, { align: 'left' });
        PDF.text('A.F.P.', 15, 79 + i * 140, { align: 'left' });
        PDF.text((element.AFP!==0)?element.AFP.toLocaleString("en-US"):'0.00', 90, 79 + i * 140, { align: 'right' });
        PDF.text('RC-IVA :', 15, 83 + i * 140, { align: 'left' });
        PDF.text((element.RCIVA!==0)?element.RCIVA.toLocaleString("en-US"):'0.00', 90, 83 + i * 140, { align: 'right' });
        PDF.text('COLEGIO MÉDICO :', 15, 88 + i * 140, { align: 'left' });
        PDF.text((element.COLEGIO!==0)?element.COLEGIO.toLocaleString("en-US"):'0.00', 90, 88 + i * 140, { align: 'right' });
        PDF.text('PRO OLIMPIADAS :', 15, 92 + i * 140, { align: 'left' });
        PDF.text((element['PRO OLIMP']!==0)?element['PRO OLIMP'].toLocaleString("en-US"):'0.00', 90, 92 + i * 140, { align: 'right' });
        PDF.text('PRO TRABAJADORES :', 15, 96 + i * 140, { align: 'left' });
        PDF.text((element['PRO TRABA']!==0)?element['PRO TRABA'].toLocaleString("en-US"):'0.00', 90, 96 + i * 140, { align: 'right' });
        PDF.text('APORTE SINDICAL :', 15, 100 + i * 140, { align: 'left' });
        PDF.text((element['APORT. SINDICAL']!==0)?element['APORT. SINDICAL'].toLocaleString("en-US"):'0.00', 90, 100 + i * 140, { align: 'right' });
        PDF.text('VARIOS :', 15, 104 + i * 140, { align: 'left' });
        PDF.text((element['MULTAS POR ATRASOS Y OTROS']!==0)?element['MULTAS POR ATRASOS Y OTROS'].toLocaleString("en-US"):'0.00', 90, 104 + i * 140, { align: 'right' });
          PDF.text('DEUDORES VARIOS :', 20, 108 + i * 140, { align: 'left' });
          PDF.text((element['DEUDORES VARIOS']!==0)?element['DEUDORES VARIOS'].toLocaleString("en-US"):'0.00', 90, 108 + i * 140, { align: 'right' });
          PDF.text('COPERATIVA :', 20, 112 + i * 140, { align: 'left' });
          PDF.text((element['COOPERATIVA 18 DE JULIO']!==0)?element['COOPERATIVA 18 DE JULIO'].toLocaleString("en-US"):'0.00', 90, 112 + i * 140, { align: 'right' });
          PDF.text('FEDERACIÓN :', 20, 116 + i * 140, { align: 'left' });
          PDF.text((element['FEDERACION NACIONAL']!==0)?element['FEDERACION NACIONAL'].toLocaleString("en-US"):'0.00', 90, 116 + i * 140, { align: 'right' });
          PDF.text('MULTAS POR ATRASOS :', 20, 120 + i * 140, { align: 'left' });
          PDF.text((element['MULTAS POR ATRASOS Y OTROS']!==0)?element['MULTAS POR ATRASOS Y OTROS'].toLocaleString("en-US"):'0.00', 90, 120 + i * 140, { align: 'right' });
      PDF.text('TOTAL DESCUENTOS :', 10, 125 + i * 140, { align: 'left' });
      PDF.text((element['TOTAL DESCUEN']!==0)?element['TOTAL DESCUEN'].toLocaleString("en-US"):'0.00', 90, 125 + i * 140, { align: 'right' });
      PDF.text('LIQUIDO PAGABLE :', 10, 130 + i * 140, { align: 'left' });
      PDF.text((element['LIQUIDO PAGABLE']!==0)?element['LIQUIDO PAGABLE'].toLocaleString("en-US"):'0.00', 90, 130 + i * 140, { align: 'right' });
      PDF.text('FIRMA', 50, 145 + i * 140, { align: 'center' });
      / ** FIN IZQUIERDO ** /
      / ** INI DERECHO ** /
      PDF.setFontSize(10);
      PDF.setFont("times", 'bold');
      PDF.setTextColor(0, 0, 80);
      PDF.text('SEGURO SOCIAL UNIVERSITARIO', 153, 13 + i * 140, { align: 'center' });
      PDF.addImage('../../../assets/escudo.png', 110, 10 + i * 140, 13, 13, 'logo', 'NONE');
      PDF.text('POTOSÍ', 153, 17 + i * 140, { align: 'center' });
      //PDF.addImage('../../../assets/escudo.png', 116, 40 + i * 140, 64, 64, 'logo', 'NONE');
      PDF.setTextColor(99, 0, 0);
      PDF.setFontSize(12);
      PDF.text(this.name, 150, 22 + i * 140, { align: 'center' });
      PDF.setTextColor(0, 0, 8);
      PDF.setFontSize(9.5);
      
      PDF.text('ITEM: ' + element['N°'] + '   NOMBRES: ' + element['NOMBRES Y APELLIDOS'], 110, 27 + i * 140, { align: 'left' });
      PDF.text('D. TRAB.: ' + element['DIAS TRAB'] + ' CARGO: ' + element.CARGO, 110, 31 + i * 140, { align: 'left' });
      PDF.setFontSize(10);
      PDF.text('INGRESOS', 110, 37 + i * 140, { align: 'left' });
        PDF.setFontSize(9);
        PDF.text('HABER BASICO :', 115, 41 + i * 140, { align: 'left' });
        PDF.text((element['HABER BASICO']!==0)?element['HABER BASICO'].toLocaleString("en-US"):'0.00', 190, 41 + i * 140, { align: 'right' });
        PDF.text('BONO DE ANTIGÜEDAD :', 115, 45 + i * 140, { align: 'left' });
        PDF.text((element['BONO ANTIGÜE']!==0)?element['BONO ANTIGÜE'].toLocaleString("en-US"):'0.00', 190, 45 + i * 140, { align: 'right' });
        PDF.text('BONO DE RIESGO :', 115, 49 + i * 140, { align: 'left' });
        PDF.text((element['BONO DE RIESGO']!==0)?element['BONO DE RIESGO'].toLocaleString("en-US"):'0.00', 190, 49 + i * 140, { align: 'right' });
        PDF.text('ESCALAFON MÉDICO :', 115, 53 + i * 140, { align: 'left' });
        PDF.text((element['ESCALAF MEDICO']!==0)?element['ESCALAF MEDICO'].toLocaleString("en-US"):'0.00', 190, 53 + i * 140, { align: 'right' });
        PDF.text('CATEGORÍA :', 115, 57 + i * 140, { align: 'left' });
        PDF.text((element['CATEG. MEDICA']!==0)?element['CATEG. MEDICA'].toLocaleString("en-US"):'0.00', 190, 57 + i * 140, { align: 'right' });
        PDF.text('COMP. DOM. Y FERIADOS :', 115, 61 + i * 140, { align: 'left' });
        PDF.text((element['COMP. DOM-FER']!==0)?element['COMP. DOM-FER'].toLocaleString("en-US"):'0.00', 190, 61 + i * 140, { align: 'right' });
        PDF.text('COMP. NOCTURNOS :', 115, 65 + i * 140, { align: 'left' });
        PDF.text((element['COMP. NOCTUR']!==0)?element['COMP. NOCTUR'].toLocaleString("en-US"):'0.00', 190, 65 + i * 140, { align: 'right' });
        PDF.text('TOTAL GANADO', 110, 70 + i * 140, { align: 'left' });
        PDF.text((element['TOTAL GANADO']!==0)?element['TOTAL GANADO'].toLocaleString("en-US"):'0.00', 190, 70 + i * 140, { align: 'right' });
      PDF.setTextColor(0, 0, 0);
      PDF.text('DESCUENTOS', 110, 75 + i * 140, { align: 'left' });
        PDF.text('A.F.P.', 115, 79 + i * 140, { align: 'left' });
        PDF.text((element.AFP!==0)?element.AFP.toLocaleString("en-US"):'0.00', 190, 79 + i * 140, { align: 'right' });
        PDF.text('RC-IVA :', 115, 83 + i * 140, { align: 'left' });
        PDF.text((element.RCIVA!==0)?element.RCIVA.toLocaleString("en-US"):'0.00', 190, 83 + i * 140, { align: 'right' });
        PDF.text('COLEGIO MÉDICO :', 115, 88 + i * 140, { align: 'left' });
        PDF.text((element.COLEGIO!==0)?element.COLEGIO.toLocaleString("en-US"):'0.00', 190, 88 + i * 140, { align: 'right' });
        PDF.text('PRO OLIMPIADAS :', 115, 92 + i * 140, { align: 'left' });
        PDF.text((element['PRO OLIMP']!==0)?element['PRO OLIMP'].toLocaleString("en-US"):'0.00', 190, 92 + i * 140, { align: 'right' });
        PDF.text('PRO TRABAJADORES :', 115, 96 + i * 140, { align: 'left' });
        PDF.text((element['PRO TRABA']!==0)?element['PRO TRABA'].toLocaleString("en-US"):'0.00', 190, 96 + i * 140, { align: 'right' });
        PDF.text('APORTE SINDICAL :', 115, 100 + i * 140, { align: 'left' });
        PDF.text((element['APORT. SINDICAL']!==0)?element['APORT. SINDICAL'].toLocaleString("en-US"):'0.00', 190, 100 + i * 140, { align: 'right' });
        PDF.text('VARIOS :', 115, 104 + i * 140, { align: 'left' });
        PDF.text((element['MULTAS POR ATRASOS Y OTROS']!==0)?element['MULTAS POR ATRASOS Y OTROS'].toLocaleString("en-US"):'0.00', 190, 104 + i * 140, { align: 'right' });
          PDF.text('DEUDORES VARIOS :', 120, 108 + i * 140, { align: 'left' });
          PDF.text((element['DEUDORES VARIOS']!==0)?element['DEUDORES VARIOS'].toLocaleString("en-US"):'0.00', 190, 108 + i * 140, { align: 'right' });
          PDF.text('COOPERATIVA :', 120, 112 + i * 140, { align: 'left' });
          PDF.text((element['COOPERATIVA 18 DE JULIO']!==0)?element['COOPERATIVA 18 DE JULIO'].toLocaleString("en-US"):'0.00', 190, 112 + i * 140, { align: 'right' });
          PDF.text('FEDERACION :', 120, 116 + i * 140, { align: 'left' });
          PDF.text((element['FEDERACION NACIONAL']!==0)?element['FEDERACION NACIONAL'].toLocaleString("en-US"):'0.00', 190, 116 + i * 140, { align: 'right' });
          PDF.text('VARIOS :', 120, 120 + i * 140, { align: 'left' });
          PDF.text((element['MULTAS POR ATRASOS Y OTROS']!==0)?element['MULTAS POR ATRASOS Y OTROS'].toLocaleString("en-US"):'0.00', 190, 120 + i * 140, { align: 'right' });
      PDF.text('TOTAL DESCUENTOS :', 110, 125 + i * 140, { align: 'left' });
      PDF.text((element['TOTAL DESCUEN']!==0)?element['TOTAL DESCUEN'].toLocaleString("en-US"):'0.00', 190, 125 + i * 140, { align: 'right' });
      PDF.text('LIQUIDO PAGABLE :', 110, 130 + i * 140, { align: 'left' });
      PDF.text((element['LIQUIDO PAGABLE']!==0)?element['LIQUIDO PAGABLE'].toLocaleString("en-US"):'0.00', 190, 130 + i * 140, { align: 'right' });
      / ** FIN DERECHO** /
      i++;
      if (i % 2 == 0) {
        PDF.addPage();
        i = 0;
      }
    });
    PDF.save(this.name + '.pdf');
  }*/
}