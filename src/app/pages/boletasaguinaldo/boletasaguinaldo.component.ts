import { Component, OnDestroy, OnInit, ElementRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { PlanillaTotal } from 'src/app/interfaces/planilla-total';
import * as XLSX from 'xlsx';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-boletasaguinaldo',
  templateUrl: './boletasaguinaldo.component.html',
  styleUrls: ['./boletasaguinaldo.component.scss']
})
export class BoletasaguinaldoComponent implements OnInit, OnDestroy {
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
  ngOnDestroy(): void { this.dtTrigger.unsubscribe(); }
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
    this.myqrcode = '';
    let sexo = (element.SEXO === 'M') ? 'MASCULINO' : 'FEMENINO';
    let emp = (element.SEXO === 'M') ? 'DEL TRABAJADOR' : 'DE LA TRABAJADORA';
    PDF.setFontSize(10);
    PDF.setFont("times", 'bold');
    PDF.setTextColor(0, 0, 80);
    PDF.text('SEGURO SOCIAL UNIVERSITARIO', 110, 22, { align: 'center' });
    PDF.text('POTOSÍ', 110, 26, { align: 'center' });
    PDF.setTextColor(184, 15, 10);
    PDF.setFontSize(14);
    PDF.text(`BOLETA DE PAGO - ${this.name}`, 110, 30, { align: 'center' });
    PDF.setFontSize(10);
    autoTable(PDF, {
      startY: 31,
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
      startY: 48,
      styles: {
        overflow: 'visible',
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
          { content: `${sexo}` }
        ]
      ]
    });
    autoTable(PDF, {
      margin: { top: 10, left: 26, right: 10, bottom: 10 },
      startY: 64,
      styles: {
        overflow: 'visible',
        fontSize: 6.25
      },
      bodyStyles: { lineColor: [189, 195, 199] },
      theme: 'grid', //|'grid'|'plain'|'css' = 'striped'
      head: [
        [{ content: `DATOS ${emp} VINCULADOS A LA RELACIÓN LABORAL`, colSpan: 3, styles: { halign: 'left' } }],
      ],
      body: [
        [
          { content: `DETALLES`, colSpan: 3, styles: { halign: 'center' } }
        ],
        [
          { content: `MESES`, colSpan: 3, styles: { halign: 'center' } },
          { content: `${element.MESES.toLocaleString("en-US")}`, colSpan: 3, styles: { halign: 'right' } },
        ],
        [
          { content: `1`, styles: { halign: 'center', } },
          { content: `SEPTIEMBRE`, styles: { halign: 'center', } },
          { content: `${(element['SEPTIEMBRE'] !== 0) ? element['SEPTIEMBRE'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right' } },
        ],
        [
          { content: `2`, styles: { halign: 'center', } },
          { content: `OCTUBRE`, styles: { halign: 'center', } },
          { content: `${(element.OCTUBRE !== 0) ? element.OCTUBRE.toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right' } },
        ],
        [
          { content: `3`, styles: { halign: 'center' } },
          { content: `NOVIEMBRE`, styles: { halign: 'center' } },
          { content: `${(element['NOVIEMBRE'] !== 0) ? element['NOVIEMBRE'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right' } }
        ],
        [
          { content: `PROMEDIO`, colSpan: 2, styles: { halign: 'center' } },
          { content: `${(element['PROMEDIO'] !== 0) ? element['PROMEDIO'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right' } },
        ],
        [
          { content: `AGUINALDO`, colSpan: 2, styles: { halign: 'center' } },
          { content: `${(element['AGUINALDO'] !== 0) ? element['AGUINALDO'].toLocaleString("en-US") : '0.00'}`, styles: { font: 'bold', halign: 'right' } }
        ]
      ]
    });
    PDF.addImage('../../../assets/escudo.png', 87, 50, 46, 46, 'logo', 'NONE');
    PDF.setFont("times", 'bold');
    PDF.setTextColor(0, 0, 0);
    PDF.setFontSize(8);
    PDF.text(`${element['NOMBRES Y APELLIDOS']}`, 110, 136, { align: 'center' });
    PDF.setTextColor(0, 0, 50);
    PDF.setFontSize(10);
    PDF.text('FIRMA', 110, 140, { align: 'center' });
    PDF.setFont("times", 'bold');
    this.myqrcode = element['NOMBRES Y APELLIDOS'];
    PDF.setFontSize(10);
    PDF.setFont("times", 'bold');
    PDF.setTextColor(0, 0, 80);
    PDF.text('SEGURO SOCIAL UNIVERSITARIO', 110, 162, { align: 'center' });
    PDF.text('POTOSÍ', 110, 166, { align: 'center' });
    PDF.setTextColor(184, 15, 10);
    PDF.setFontSize(14);
    PDF.text(`BOLETA DE PAGO - ${this.name}`, 110, 170, { align: 'center' });
    PDF.setFontSize(10);
    autoTable(PDF, {
      startY: 171,
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
      startY: 184,
      styles: {
        overflow: 'visible',
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
          { content: `${sexo}` }
        ]
      ]
    });

    autoTable(PDF, {
      margin: { top: 10, left: 26, right: 10, bottom: 10 },
      startY: 200,
      styles: {
        overflow: 'visible',
        fontSize: 6.25
      },
      bodyStyles: { lineColor: [189, 195, 199] },
      theme: 'grid', //|'grid'|'plain'|'css' = 'striped'
      head: [
        [{ content: `DATOS ${emp} VINCULADOS A LA RELACIÓN LABORAL`, colSpan: 3, styles: { halign: 'left' } }],
      ],
      body: [
        [
          { content: `DETALLES`, colSpan: 3, styles: { halign: 'center' } }
        ],
        [
          { content: `MESES`, colSpan: 3, styles: { halign: 'center' } },
          { content: `${element.MESES.toLocaleString("en-US")}`, styles: { halign: 'right' } },
        ],
        [
          { content: `1`, styles: { halign: 'center', } },
          { content: `SEPTIEMBRE`, styles: { halign: 'center', } },
          { content: `${(element['SEPTIEMBRE'] !== 0) ? element['SEPTIEMBRE'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right' } },
        ],
        [
          { content: `2`, styles: { halign: 'center', } },
          { content: `OCTUBRE`, styles: { halign: 'center', } },
          { content: `${(element.OCTUBRE !== 0) ? element.OCTUBRE.toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right' } },
        ],
        [
          { content: `3`, styles: { halign: 'center' } },
          { content: `NOVIEMBRE`, styles: { halign: 'center' } },
          { content: `${(element['NOVIEMBRE'] !== 0) ? element['NOVIEMBRE'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right' } },
        ],
        [
          { content: `PROMEDIO`, colSpan: 2, styles: { halign: 'center' } },
          { content: `${(element['PROMEDIO'] !== 0) ? element['PROMEDIO'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right' } },
        ],
        [
          { content: `AGUINALDO`, colSpan: 2, styles: { halign: 'center' } },
          { content: `${(element['AGUINALDO'] !== 0) ? element['AGUINALDO'].toLocaleString("en-US") : '0.00'}`, styles: { font: 'bold', halign: 'right' } },
        ]
      ]
    });
    PDF.addImage('../../../assets/escudo.png', 87, 185, 46, 46, 'logo', 'NONE');
    /*PDF.setFont("times", 'bold');
    PDF.setTextColor(0, 0, 0);
    PDF.setFontSize(8);
    PDF.text(`${element['NOMBRES Y APELLIDOS']}`, 110, 276, { align: 'center' });
    PDF.setTextColor(0, 0, 50);
    PDF.setFontSize(10);
    PDF.text('FIRMA', 110, 280, { align: 'center' });
    PDF.setFont("times", 'bold');
    this.myqrcode = element['NOMBRES Y APELLIDOS'];*/
    PDF.save(element['NOMBRES Y APELLIDOS'] + '.pdf');
  }
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
      PDF.text('SEGURO SOCIAL UNIVERSITARIO', 110, 22, { align: 'center' });
      PDF.text('POTOSÍ', 110, 26, { align: 'center' });
      PDF.setTextColor(184, 15, 10);
      PDF.setFontSize(14);
      PDF.text(`BOLETA DE PAGO - ${this.name}`, 110, 30, { align: 'center' });
      PDF.setFontSize(10);
      autoTable(PDF, {
        startY: 31,
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
        startY: 48,
        styles: {
          overflow: 'visible',
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
            { content: `${sexo}` }
          ]
        ]
      });
      autoTable(PDF, {
        margin: { top: 10, left: 26, right: 10, bottom: 10 },
        startY: 64,
        styles: {
          overflow: 'visible',
          fontSize: 6.25
        },
        bodyStyles: { lineColor: [189, 195, 199] },
        theme: 'grid', //|'grid'|'plain'|'css' = 'striped'
        head: [
          [{ content: `DATOS ${emp} VINCULADOS A LA RELACIÓN LABORAL`, colSpan: 3, styles: { halign: 'left' } }],
        ],
        body: [
          [
            { content: `DETALLES`, colSpan: 3, styles: { halign: 'center' } }
          ],
          [
            { content: `MESES`, colSpan: 3, styles: { halign: 'center' } },
            { content: `${element.MESES.toLocaleString("en-US")}`, colSpan: 3, styles: { halign: 'right' } },
          ],
          [
            { content: `1`, styles: { halign: 'center', } },
            { content: `SEPTIEMBRE`, styles: { halign: 'center', } },
            { content: `${(element['SEPTIEMBRE'] !== 0) ? element['SEPTIEMBRE'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right' } },
          ],
          [
            { content: `2`, styles: { halign: 'center', } },
            { content: `OCTUBRE`, styles: { halign: 'center', } },
            { content: `${(element.OCTUBRE !== 0) ? element.OCTUBRE.toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right' } },
          ],
          [
            { content: `3`, styles: { halign: 'center' } },
            { content: `NOVIEMBRE`, styles: { halign: 'center' } },
            { content: `${(element['NOVIEMBRE'] !== 0) ? element['NOVIEMBRE'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right' } }
          ],
          [
            { content: `PROMEDIO`, colSpan: 2, styles: { halign: 'center' } },
            { content: `${(element['PROMEDIO'] !== 0) ? element['PROMEDIO'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right' } },
          ],
          [
            { content: `AGUINALDO`, colSpan: 2, styles: { halign: 'center' } },
            { content: `${(element['AGUINALDO'] !== 0) ? element['AGUINALDO'].toLocaleString("en-US") : '0.00'}`, styles: { font: 'bold', halign: 'right' } }
          ]
        ]
      });
      PDF.addImage('../../../assets/escudo.png', 87, 50, 46, 46, 'logo', 'NONE');
      PDF.setFont("times", 'bold');
      PDF.setTextColor(0, 0, 0);
      PDF.setFontSize(8);
      PDF.text(`${element['NOMBRES Y APELLIDOS']}`, 110, 136, { align: 'center' });
      PDF.setTextColor(0, 0, 50);
      PDF.setFontSize(10);
      PDF.text('FIRMA', 110, 140, { align: 'center' });
      PDF.setFont("times", 'bold');
      this.myqrcode = element['NOMBRES Y APELLIDOS'];
      /*i++;
      if (i % 2 == 0) {
        PDF.addPage();
        i = 0;
      }*/
      PDF.setFontSize(10);
      PDF.setFont("times", 'bold');
      PDF.setTextColor(0, 0, 80);
      PDF.text('SEGURO SOCIAL UNIVERSITARIO', 110, 162, { align: 'center' });
      PDF.text('POTOSÍ', 110, 166, { align: 'center' });
      PDF.setTextColor(184, 15, 10);
      PDF.setFontSize(14);
      PDF.text(`BOLETA DE PAGO - ${this.name}`, 110, 170, { align: 'center' });
      PDF.setFontSize(10);
      autoTable(PDF, {
        startY: 171,
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
        startY: 184,
        styles: {
          overflow: 'visible',
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
            { content: `${sexo}` }
          ]
        ]
      });

      autoTable(PDF, {
        margin: { top: 10, left: 26, right: 10, bottom: 10 },
        startY: 200,
        styles: {
          overflow: 'visible',
          fontSize: 6.25
        },
        bodyStyles: { lineColor: [189, 195, 199] },
        theme: 'grid', //|'grid'|'plain'|'css' = 'striped'
        head: [
          [{ content: `DATOS ${emp} VINCULADOS A LA RELACIÓN LABORAL`, colSpan: 3, styles: { halign: 'left' } }],
        ],
        body: [
          [
            { content: `DETALLES`, colSpan: 3, styles: { halign: 'center' } }
          ],
          [
            { content: `MESES`, colSpan: 3, styles: { halign: 'center' } },
            { content: `${element.MESES.toLocaleString("en-US")}`, styles: { halign: 'right' } },
          ],
          [
            { content: `1`, styles: { halign: 'center', } },
            { content: `SEPTIEMBRE`, styles: { halign: 'center', } },
            { content: `${(element['SEPTIEMBRE'] !== 0) ? element['SEPTIEMBRE'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right' } },
          ],
          [
            { content: `2`, styles: { halign: 'center', } },
            { content: `OCTUBRE`, styles: { halign: 'center', } },
            { content: `${(element.OCTUBRE !== 0) ? element.OCTUBRE.toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right' } },
          ],
          [
            { content: `3`, styles: { halign: 'center' } },
            { content: `NOVIEMBRE`, styles: { halign: 'center' } },
            { content: `${(element['NOVIEMBRE'] !== 0) ? element['NOVIEMBRE'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right' } },
          ],
          [
            { content: `PROMEDIO`, colSpan: 2, styles: { halign: 'center' } },
            { content: `${(element['PROMEDIO'] !== 0) ? element['PROMEDIO'].toLocaleString("en-US") : '0.00'}`, styles: { halign: 'right' } },
          ],
          [
            { content: `AGUINALDO`, colSpan: 2, styles: { halign: 'center' } },
            { content: `${(element['AGUINALDO'] !== 0) ? element['AGUINALDO'].toLocaleString("en-US") : '0.00'}`, styles: { font: 'bold', halign: 'right' } },
          ]
        ]
      });
      PDF.addImage('../../../assets/escudo.png', 87, 185, 46, 46, 'logo', 'NONE');
      /*PDF.setFont("times", 'bold');
      PDF.setTextColor(0, 0, 0);
      PDF.setFontSize(8);
      PDF.text(`${element['NOMBRES Y APELLIDOS']}`, 110, 276, { align: 'center' });
      PDF.setTextColor(0, 0, 50);
      PDF.setFontSize(10);
      PDF.text('FIRMA', 110, 280, { align: 'center' });
      PDF.setFont("times", 'bold');
      this.myqrcode = element['NOMBRES Y APELLIDOS'];*/
      PDF.addPage();
    });
    PDF.save(this.name + '.pdf');
  }
}