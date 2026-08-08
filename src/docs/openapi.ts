export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'نظام إدارة مسير الرواتب السعودي والربط المحاسبي API (Saudi Payroll & ERP Journal API)',
    version: '1.0.0',
    description: `توثيق رسمي شامل لكافة واجهات برمجة التطبيقات (API Endpoints) الخاصة بنظام مسير الرواتب والامتثال لنظام العمل السعودي والتأمينات الاجتماعية (GOSI) وحماية الأجور (WPS)، بالإضافة إلى القيود المحاسبية المزدوجة والنظام متعدد الشركات (Multi-Tenant).

### الأمان والتوثيق (Authentication)
* **Bearer Token**: استخدم \`Authorization: Bearer <your_jwt_token>\` للدخول.
* يتم تحديد الشركة الحالية تلقائياً من حساب المستخدم الموثق في قاعدة البيانات، ولا يتم قبول معرّف الشركة من ترويسات الطلب.`,
    contact: {
      name: 'فريق دعم نظام الرواتب',
      email: 'support@payroll.sa'
    }
  },
  servers: [
    {
      url: '/api',
      description: 'خادم تطوير التطبيقات المحلي والرسمي'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'رمز JWT المعطى عند تسجل الدخول'
      }
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'UNAUTHORIZED' },
              message: { type: 'string', example: 'رمز التوثيق مفقود أو غير صالح' }
            }
          }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'usr-001' },
          username: { type: 'string', example: 'admin' },
          name: { type: 'string', example: 'مدير النظام' },
          email: { type: 'string', example: 'admin@payroll.sa' },
          role: { type: 'string', enum: ['admin', 'hr_manager', 'payroll_officer', 'employee'], example: 'admin' },
          companyId: { type: 'string', example: '{company-id}' }
        }
      },
      Company: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '{company-id}' },
          name: { type: 'string', example: 'شركة الرؤية للحلول البرمجية' },
          code: { type: 'string', example: 'VISION' },
          crNumber: { type: 'string', example: '1010123456' },
          currency: { type: 'string', example: 'SAR' },
          chartOfAccounts: {
            type: 'object',
            properties: {
              salariesAccountCode: { type: 'string', example: '5101' },
              salariesAccountName: { type: 'string', example: 'مصروف الأجور والبدلات' },
              gosiExpenseAccountCode: { type: 'string', example: '5105' },
              gosiExpenseAccountName: { type: 'string', example: 'مصروف التأمينات الاجتماعية (صاحب العمل)' },
              payrollPayableAccountCode: { type: 'string', example: '2101' },
              payrollPayableAccountName: { type: 'string', example: 'ذمم الرواتب الصافية المستحقة (WPS)' },
              gosiPayableAccountCode: { type: 'string', example: '2105' },
              gosiPayableAccountName: { type: 'string', example: 'مستحقات التأمينات الاجتماعية' }
            }
          },
          wpsConfig: {
            type: 'object',
            properties: {
              payerId: { type: 'string', example: '7000123456' },
              payerBankCode: { type: 'string', example: 'NCBK' },
              payerIban: { type: 'string', example: 'SA0310000001234567890123' },
              establishmentName: { type: 'string', example: 'شركة الرؤية للحلول البرمجية' }
            }
          },
          accountingApiConfig: {
            type: 'object',
            properties: {
              apiUrl: { type: 'string', example: '/api/mock/accounting/vision' },
              apiKey: { type: 'string', example: 'vision_secret_key' },
              autoSyncOnApproval: { type: 'boolean', example: true }
            }
          }
        }
      },
      Employee: {
        type: 'object',
        required: ['firstName', 'lastName', 'nationalId', 'email', 'department', 'position', 'baseSalary'],
        properties: {
          id: { type: 'string', example: 'emp-101' },
          companyId: { type: 'string', example: '{company-id}' },
          employeeCode: { type: 'string', example: 'EMP-001' },
          firstName: { type: 'string', example: 'سارة' },
          lastName: { type: 'string', example: 'الحربي' },
          nationalId: { type: 'string', description: 'رقم الهوية الوطنية أو الإقامة (مشفر)', example: '1088990011' },
          email: { type: 'string', example: 'sara@company.sa' },
          phone: { type: 'string', example: '+966501234567' },
          department: { type: 'string', example: 'الهندسة والتقنية' },
          position: { type: 'string', example: 'مهندسة برمجيات' },
          status: { type: 'string', enum: ['active', 'on_leave', 'terminated'], example: 'active' },
          employmentType: { type: 'string', enum: ['full_time', 'part_time', 'contract'], example: 'full_time' },
          isSaudi: { type: 'boolean', example: true, description: 'يؤثر على نسبة استقطاع التأمينات GOSI' },
          joinDate: { type: 'string', format: 'date', example: '2023-01-15' },
          baseSalary: { type: 'number', example: 12000 },
          housingAllowance: { type: 'number', example: 3000 },
          transportAllowance: { type: 'number', example: 1000 },
          otherAllowances: { type: 'number', example: 500 },
          bankName: { type: 'string', example: 'البنك الأهلي السعودي' },
          bankCode: { type: 'string', example: 'NCBK' },
          iban: { type: 'string', description: 'رقم الآيبان (مشفر)', example: 'SA4410000001234567890123' },
          taxExempt: { type: 'boolean', example: false },
          socialSecurityEnrolled: { type: 'boolean', example: true }
        }
      },
      PayrollRun: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'pr-2026-08' },
          companyId: { type: 'string', example: '{company-id}' },
          runCode: { type: 'string', example: 'PAY-202608' },
          title: { type: 'string', example: 'مسير رواتب شهر أغسطس 2026' },
          period: { type: 'string', example: '2026-08' },
          status: { type: 'string', enum: ['draft', 'calculated', 'review', 'approved', 'paid', 'cancelled'], example: 'approved' },
          totalEmployees: { type: 'number', example: 12 },
          totalGrossPay: { type: 'number', example: 155000 },
          totalDeductions: { type: 'number', example: 14725 },
          totalEmployerContributions: { type: 'number', example: 18600 },
          totalNetPay: { type: 'number', example: 140275 },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      JournalEntry: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'je-101' },
          companyId: { type: 'string', example: '{company-id}' },
          runId: { type: 'string', example: 'pr-2026-08' },
          runCode: { type: 'string', example: 'PAY-202608' },
          reference: { type: 'string', example: 'PAY-202608' },
          period: { type: 'string', example: '2026-08' },
          status: { type: 'string', enum: ['pending', 'sent', 'confirmed', 'failed'], example: 'confirmed' },
          retryCount: { type: 'number', example: 0 },
          totalDebit: { type: 'number', example: 173600 },
          totalCredit: { type: 'number', example: 173600 },
          journalData: {
            type: 'object',
            properties: {
              reference: { type: 'string', example: 'PAY-202608' },
              description: { type: 'string', example: 'قيد رواتب شهر 2026-08' },
              lines: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    accountCode: { type: 'string', example: '5101' },
                    accountName: { type: 'string', example: 'مصروف الأجور والبدلات' },
                    debit: { type: 'number', example: 155000 },
                    credit: { type: 'number', example: 0 },
                    description: { type: 'string', example: 'إجمالي استحقاقات الموظفين' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  security: [
    { BearerAuth: [] }
  ],
  paths: {
    '/auth/login': {
      post: {
        tags: ['التوثيق والحسابات (Auth)'],
        summary: 'تسجيل الدخول للنظام والحصول على رمز JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string', example: 'admin' },
                  password: { type: 'string', example: 'admin123' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'تم تسجيل الدخول بنجاح',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                    user: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          },
          401: {
            description: 'اسم المستخدم أو كلمة المرور غير صحيحة',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/auth/register': {
      post: {
        tags: ['التوثيق والحسابات (Auth)'],
        summary: 'تسجيل حساب مستخدم جديد',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password', 'name', 'email'],
                properties: {
                  username: { type: 'string', example: 'payroll_officer1' },
                  password: { type: 'string', example: 'secretPass123' },
                  name: { type: 'string', example: 'محمد العتيبي' },
                  email: { type: 'string', example: 'm.otaibi@company.sa' },
                  role: { type: 'string', example: 'payroll_officer' },
                  companyId: { type: 'string', example: '{company-id}' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'تم إنشاء المستخدم بنجاح',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    user: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/auth/me': {
      get: {
        tags: ['التوثيق والحسابات (Auth)'],
        summary: 'جلب بيانات المستخدم الحالي المسجل الدخول',
        responses: {
          200: {
            description: 'بيانات المستخدم الحالي',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    user: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/companies': {
      get: {
        tags: ['إدارة الشركات (Companies & Tenants)'],
        summary: 'عرض جميع الشركات المسجلة في النظام',
        responses: {
          200: {
            description: 'قائمة الشركات',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Company' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['إدارة الشركات (Companies & Tenants)'],
        summary: 'إضافة شركة جديدة في النظام Multi-Tenant',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'code'],
                properties: {
                  name: { type: 'string', example: 'شركة الأفق التقنية' },
                  code: { type: 'string', example: 'HORIZON' },
                  crNumber: { type: 'string', example: '1010889900' },
                  currency: { type: 'string', example: 'SAR' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'تمت إضافة الشركة بنجاح',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Company' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/companies/{id}': {
      get: {
        tags: ['إدارة الشركات (Companies & Tenants)'],
        summary: 'جلب تفاصيل شركة محددة بحسب المعرف',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '{company-id}' }
        ],
        responses: {
          200: {
            description: 'بيانات الشركة',
            content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Company' } } } } }
          },
          404: { description: 'الشركة غير موجودة' }
        }
      },
      put: {
        tags: ['إدارة الشركات (Companies & Tenants)'],
        summary: 'تحديث إعدادات ودليل حسابات وربط API الشركة',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '{company-id}' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  chartOfAccounts: { type: 'object' },
                  wpsConfig: { type: 'object' },
                  accountingApiConfig: { type: 'object' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'تم التحديث بنجاح' }
        }
      }
    },
    '/companies/{id}/test-api': {
      post: {
        tags: ['إدارة الشركات (Companies & Tenants)'],
        summary: 'فحص واختبار الاتصال والترحيل مع نظام ERP المحاسبي الخاص بالشركة',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '{company-id}' }
        ],
        responses: {
          200: {
            description: 'نتيجة الفحص واختبار ترحيل القيد التجريبي',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        companyId: { type: 'string' },
                        authStatus: { type: 'string', example: 'VALID_API_KEY' },
                        latencyMs: { type: 'number', example: 28 }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/employees': {
      get: {
        tags: ['شؤون الموظفين (Employees)'],
        summary: 'عرض قائمة الموظفين المسجلين في الشركة الحالية',
        responses: {
          200: {
            description: 'قائمة الموظفين مع إخفاء وتشفير PII السري',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Employee' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['شؤون الموظفين (Employees)'],
        summary: 'إضافة موظف جديد',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Employee' }
            }
          }
        },
        responses: {
          201: { description: 'تم إنشاء الموظف بنجاح' }
        }
      }
    },
    '/employees/{id}': {
      get: {
        tags: ['شؤون الموظفين (Employees)'],
        summary: 'جلب بيانات موظف محدد',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'بيانات الموظف' }, 404: { description: 'الموظف غير موجود' } }
      },
      put: {
        tags: ['شؤون الموظفين (Employees)'],
        summary: 'تحديث بيانات الموظف (الراتب، البدلات، الحساب البنكي)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { 200: { description: 'تم التحديث بنجاح' } }
      },
      delete: {
        tags: ['شؤون الموظفين (Employees)'],
        summary: 'حذف موظف من النظام',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'تم الحذف بنجاح' } }
      }
    },
    '/payroll/calculate': {
      post: {
        tags: ['مسير الرواتب (Payroll Engine)'],
        summary: 'حساب واحتساب مسير الرواتب الشهري وفقاً لنظام العمل و GOSI',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['period'],
                properties: {
                  period: { type: 'string', example: '2026-08' },
                  title: { type: 'string', example: 'مسير رواتب شهر أغسطس 2026' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'تم احتساب مسير الرواتب وتوليد قواطع وقسائم الرواتب بنجاح',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/PayrollRun' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/payroll/runs': {
      get: {
        tags: ['مسير الرواتب (Payroll Engine)'],
        summary: 'عرض كافة دورات ومسيرات الرواتب المحسوبة',
        responses: {
          200: {
            description: 'قائمة المسيرات',
            content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/PayrollRun' } } } } } }
          }
        }
      }
    },
    '/payroll/runs/{id}/status': {
      patch: {
        tags: ['مسير الرواتب (Payroll Engine)'],
        summary: 'تحديث حالة مسير الرواتب (اعتماد approved / دفع paid) وإنشاء القيد المحاسبي المزدوج تلقائياً',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['draft', 'calculated', 'approved', 'paid', 'cancelled'], example: 'approved' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'تم تحديث حالة المسير وتوليد القيد المحاسبي' }
        }
      }
    },
    '/payroll/journals': {
      get: {
        tags: ['القيود المحاسبية والربط (Accounting Journals)'],
        summary: 'عرض كافة القيود المحاسبية المزدوجة المترتبة على المسيرات مع حالة الترحيل للـ ERP',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['all', 'pending', 'sent', 'confirmed', 'failed'] }, description: 'تصفية حسب حالة الترحيل' },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'بحث باسم القيد أو الرمز' }
        ],
        responses: {
          200: {
            description: 'قائمة القيود مع ملخص الإحصائيات',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/JournalEntry' } }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/payroll/journals/{id}/retry': {
      post: {
        tags: ['القيود المحاسبية والربط (Accounting Journals)'],
        summary: 'إعادة ترحيل قيد محاسبي فاشل إلى برنامج ERP المحاسبي',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'je-101' }],
        responses: {
          200: { description: 'نتيجة محاولة الترحيل' }
        }
      }
    },
    '/reports/wps-export': {
      get: {
        tags: ['التقارير وحماية الأجور (WPS Reports)'],
        summary: 'توليد وتنزيل ملف حماية الأجور الوزاري المعتمد (WPS SIF File)',
        parameters: [{ name: 'runId', in: 'query', required: true, schema: { type: 'string' }, example: 'pr-2026-08' }],
        responses: {
          200: {
            description: 'محتوى ملف WPS بتنسيق SIF المعتمد',
            content: { 'text/csv': { schema: { type: 'string' } } }
          }
        }
      }
    },
    '/system/worker-status': {
      get: {
        tags: ['مهام النظام والخلفية (Background Worker)'],
        summary: 'استعلام عن حالة خدمة المعالجة في الخلفية (Background Worker Health)',
        responses: {
          200: {
            description: 'حالة الـ Worker وقائمة الوظائف المعالجة',
            content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' } } } } }
          }
        }
      }
    }
  }
};