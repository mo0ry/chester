console.log('🔧 OrderManager.js script loading...');

class OrderManager {
    constructor() {
        console.log('🚀 OrderManager constructor called');
        this.apiClient = null;
        this.currentStep = 1;
        this.totalSteps = 4;
        this.orderData = {
            customer_name: '',
            customer_phone: '',
            customer_address: '',
            order_type: 'فروش خانگی',
            products: [],
            payment_method: 'نقدی'
        };
        this.productsByCategory = {};
        
        this.init();
    }

    async init() {
        try {
            console.log('🔧 OrderManager.init() called');
            await this.waitForApiClient();
            await this.loadAllProducts();
            this.setupEventListeners();
            this.setDefaultDates();
            
            console.log('✅ OrderManager initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing OrderManager:', error);
            this.showError('خطا در راه‌اندازی سیستم سفارش');
        }
    }

    async waitForApiClient() {
        return new Promise((resolve) => {
            console.log('⏳ OrderManager waiting for apiClient...');
            
            const checkApiClient = () => {
                if (window.apiClient && typeof window.apiClient.get === 'function') {
                    console.log('✅ OrderManager - apiClient is ready!');
                    this.apiClient = window.apiClient;
                    resolve();
                } else {
                    console.log('⏳ OrderManager - apiClient not ready yet...');
                    setTimeout(checkApiClient, 100);
                }
            };
            
            document.addEventListener('apiClientReady', () => {
                console.log('🎯 OrderManager - apiClientReady event received');
                if (window.apiClient) {
                    this.apiClient = window.apiClient;
                    resolve();
                }
            });
            
            checkApiClient();
        });
    }

	async loadAllProducts() {
		try {
			console.log('📦 Loading all products by status...');
			const statuses = [11, 2, 3, 4, 5, 6, 7, 8, 9];
			this.productsByCategory = {};
			
			const loadPromises = statuses.map(async (status) => {
				try {
					const response = await this.apiClient.get(`products/by_status?status=${status}`);
					if (response.success && response.data && Array.isArray(response.data)) {
						this.productsByCategory[status] = response.data;
						console.log(`✅ Loaded ${response.data.length} products for status ${status}`);
					} else {
						console.warn(`⚠️ No products found for status ${status}`);
						this.productsByCategory[status] = [];
					}
				} catch (error) {
					console.error(`❌ Error loading products for status ${status}:`, error);
					this.productsByCategory[status] = [];
				}
			});
			
			await Promise.all(loadPromises);
			this.renderProductSelectors();
			
		} catch (error) {
			console.error('❌ Error loading products:', error);
			this.showError('خطا در بارگذاری محصولات');
			this.loadSampleProducts(); // استفاده از داده‌های نمونه
		}
	}

    loadSampleProducts() {
        console.log('📦 Loading sample products for development...');
        this.productsByCategory = {
            11: [
                {
                    code: 1001,
                    name_fa: 'مبلمان کلاسیک چستر',
                    name_en: 'Classic Chester Sofa',
                    color: 'مشکی',
                    comment: 'مبلمان کلاسیک با چوب طبیعی',
                    quantities: { DA: 5, CA: 3, BA: 2, AA: 1 },
                    cloth: 'پارچه مخمل',
                    price: 12500000,
                    status: 11,
                    active: true
                },
                {
                    code: 1002,
                    name_fa: 'مبلمان مدرن اروپایی',
                    name_en: 'Modern European Sofa',
                    color: 'سفید', 
                    comment: 'مبلمان مدرن با طراحی اروپایی',
                    quantities: { DA: 4, CA: 2, BA: 1, AA: 0 },
                    cloth: 'پارچه کتان',
                    price: 15800000,
                    status: 11,
                    active: true
                }
            ],
            2: [
                {
                    code: 2001,
                    name_fa: 'جلو مبلی سلطنتی',
                    name_en: 'Royal Loveseat',
                    color: 'طلایی',
                    comment: 'جلو مبلی سلطنتی با روکش چرم',
                    quantities: { DA: 8, CA: 0, BA: 0, AA: 0 },
                    cloth: 'چرم طبیعی',
                    price: 8500000,
                    status: 2,
                    active: true
                }
            ],
            3: [
                {
                    code: 3001,
                    name_fa: 'صندلی غذا خوری مدرن',
                    name_en: 'Modern Dining Chair',
                    color: 'قهوه‌ای',
                    comment: 'صندلی غذا خوری با طراحی مدرن',
                    quantities: { DA: 12, CA: 0, BA: 0, AA: 0 },
                    cloth: 'پارچه ضد لک',
                    price: 1200000,
                    status: 3,
                    active: true
                }
            ]
        };
        
        this.renderProductSelectors();
    }

    renderProductSelectors() {
        const container = document.getElementById('products-container');
        if (!container) {
            console.error('❌ Products container not found');
            return;
        }

        let html = `
            <div class="products-section">
                <h3 class="text-white text-xl font-bold mb-6 text-center">انتخاب محصولات</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        `;

        // مبل (Status 11)
        if (this.productsByCategory[11] && this.productsByCategory[11].length > 0) {
            html += this.renderProductSelector(11, 'نوع مبل', 'Products_List1');
        }

        // سایر محصولات
        const otherProducts = [
            { status: 2, label: 'نوع جلو مبلی', name: 'Products_List2' },
            { status: 3, label: 'نوع صندلی غذا خوری', name: 'Products_List3' },
            { status: 4, label: 'نوع میز غذا خوری', name: 'Products_List4' },
            { status: 5, label: 'نوع عسلی', name: 'Products_List5' },
            { status: 7, label: 'نوع کنسول', name: 'Products_List7' },
            { status: 8, label: 'نوع میز تلویزیون', name: 'Products_List8' },
            { status: 9, label: 'سرویس خواب', name: 'Products_List9' },
            { status: 6, label: 'سایر محصولات', name: 'Products_List6' }
        ];

        otherProducts.forEach(item => {
            if (this.productsByCategory[item.status] && this.productsByCategory[item.status].length > 0) {
                html += this.renderProductSelector(item.status, item.label, item.name);
            }
        });

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;
        this.setupProductChangeListeners();
        console.log('✅ Product selectors rendered');
    }

    renderProductSelector(status, label, name) {
        const products = this.productsByCategory[status];
        const productNumber = name.replace('Products_List', '');
        
        let options = '<option value="0">انتخاب کنید</option>';
        products.forEach(product => {
            options += `<option value="${product.name_fa}">${product.name_fa}</option>`;
        });

        let additionalFields = '';
        
        if (status === 11) {
            // فیلدهای مبل (اضافه کردن frim, parche برای match با backend)
            additionalFields = `
                <div class="product-fields mt-3 p-4 bg-white/5 rounded-lg hidden" id="fields-${productNumber}">
                    <h4 class="text-white font-semibold mb-3">جزئیات مبل</h4>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="order-form-label text-sm">تک نفره</label>
                            <input type="number" id="DA_${productNumber}" class="order-form-input text-sm" value="0" min="0">
                        </div>
                        <div>
                            <label class="order-form-label text-sm">دو نفره</label>
                            <input type="number" id="CA_${productNumber}" class="order-form-input text-sm" value="0" min="0">
                        </div>
                        <div>
                            <label class="order-form-label text-sm">سه نفره</label>
                            <input type="number" id="BA_${productNumber}" class="order-form-input text-sm" value="0" min="0">
                        </div>
                        <div>
                            <label class="order-form-label text-sm">کنج/پاف</label>
                            <input type="number" id="AA_${productNumber}" class="order-form-input text-sm" value="0" min="0">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4 mt-3">
                        <div>
                            <label class="order-form-label text-sm">فریم تک نفره</label>
                            <input type="text" id="frim_da_${productNumber}" class="order-form-input text-sm" placeholder="فریم DA">
                        </div>
                        <div>
                            <label class="order-form-label text-sm">پارچه تک نفره</label>
                            <input type="text" id="parche_da_${productNumber}" class="order-form-input text-sm" placeholder="پارچه DA">
                        </div>
                        <div>
                            <label class="order-form-label text-sm">فریم دو نفره</label>
                            <input type="text" id="frim_ca_${productNumber}" class="order-form-input text-sm" placeholder="فریم CA">
                        </div>
                        <div>
                            <label class="order-form-label text-sm">پارچه دو نفره</label>
                            <input type="text" id="parche_ca_${productNumber}" class="order-form-input text-sm" placeholder="پارچه CA">
                        </div>
                        <div>
                            <label class="order-form-label text-sm">فریم سه نفره</label>
                            <input type="text" id="frim_ba_${productNumber}" class="order-form-input text-sm" placeholder="فریم BA">
                        </div>
                        <div>
                            <label class="order-form-label text-sm">پارچه سه نفره</label>
                            <input type="text" id="parche_ba_${productNumber}" class="order-form-input text-sm" placeholder="پارچه BA">
                        </div>
                        <div>
                            <label class="order-form-label text-sm">فریم کنج/پاف</label>
                            <input type="text" id="frim_aa_${productNumber}" class="order-form-input text-sm" placeholder="فریم AA">
                        </div>
                        <div>
                            <label class="order-form-label text-sm">پارچه کنج/پاف</label>
                            <input type="text" id="parche_aa_${productNumber}" class="order-form-input text-sm" placeholder="پارچه AA">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4 mt-3">
                        <div>
                            <label class="order-form-label text-sm">رنگ</label>
                            <input type="text" id="Color_${productNumber}" class="order-form-input text-sm" placeholder="رنگ محصول">
                        </div>
                        <div>
                            <label class="order-form-label text-sm">توضیحات</label>
                            <textarea id="Comment_${productNumber}" class="order-form-input order-form-textarea text-sm" placeholder="توضیحات اضافی" rows="2"></textarea>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // فیلدهای سایر محصولات (برای صندلی غذا خوری، parche/frim اضافه شد)
            additionalFields = `
                <div class="product-fields mt-3 p-4 bg-white/5 rounded-lg hidden" id="fields-${productNumber}">
                    <h4 class="text-white font-semibold mb-3">جزئیات محصول</h4>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="order-form-label text-sm">تعداد</label>
                            <input type="number" id="quantity_${productNumber}" class="order-form-input text-sm" value="0" min="0">
                        </div>
                        <div>
                            <label class="order-form-label text-sm">رنگ</label>
                            <input type="text" id="Color_${productNumber}" class="order-form-input text-sm" placeholder="رنگ محصول">
                        </div>
                    </div>
                    ${status === 3 ? `
                    <div class="grid grid-cols-2 gap-4 mt-3">
                        <div>
                            <label class="order-form-label text-sm">فریم</label>
                            <input type="text" id="frim_${productNumber}" class="order-form-input text-sm" placeholder="فریم">
                        </div>
                        <div>
                            <label class="order-form-label text-sm">پارچه</label>
                            <input type="text" id="parche_${productNumber}" class="order-form-input text-sm" placeholder="پارچه">
                        </div>
                    </div>
                    ` : ''}
                    <div class="mt-3">
                        <label class="order-form-label text-sm">توضیحات</label>
                        <textarea id="Comment_${productNumber}" class="order-form-input order-form-textarea text-sm" placeholder="توضیحات اضافی" rows="2"></textarea>
                    </div>
                </div>
            `;
        }

        return `
            <div class="product-selector-group mb-4">
                <label class="order-form-label">${label}</label>
                <select name="${name}" class="order-form-input product-selector" data-status="${status}">
                    ${options}
                </select>
                ${additionalFields}
            </div>
        `;
    }

    setupProductChangeListeners() {
        document.querySelectorAll('.product-selector').forEach(select => {
            select.addEventListener('change', (e) => {
                this.handleProductChange(e.target);
            });
        });
        console.log('✅ Product change listeners setup');
    }

    handleProductChange(select) {
        const productName = select.value;
        const status = select.dataset.status;
        const productNumber = select.name.replace('Products_List', '');
        
        // پنهان کردن تمام فیلدهای محصولات
        document.querySelectorAll('.product-fields').forEach(field => {
            field.classList.add('hidden');
        });
        
        if (productName === '0') {
            this.clearProductFields(select.name);
            return;
        }

        try {
            const product = this.productsByCategory[status].find(p => p.name_fa === productName);
            if (product) {
                // نمایش فیلدهای مربوطه
                const fieldsContainer = document.getElementById(`fields-${productNumber}`);
                if (fieldsContainer) {
                    fieldsContainer.classList.remove('hidden');
                }
                
                this.updateProductFields(select.name, status, product);
            }
        } catch (error) {
            console.error('Error handling product change:', error);
            this.showError('خطا در بارگذاری اطلاعات محصول');
        }
    }

    updateProductFields(selectName, status, product) {
        const productNumber = selectName.replace('Products_List', '');
        
        if (status == 11) {
            // مبل - آپدیت فیلدهای تعداد (کامل کردن کد ترونکیت شده)
            this.updateMabalFields(productNumber, product);
        } else {
            // سایر محصولات - آپدیت فیلدهای ساده
            this.updateSimpleProductFields(productNumber, product);
        }
        
        this.showSuccess(`محصول "${product.name_fa}" انتخاب شد`);
    }

    updateMabalFields(productNumber, product) {
        // آپدیت فیلدهای تعداد
        const daField = document.getElementById(`DA_${productNumber}`);
        const caField = document.getElementById(`CA_${productNumber}`);
        const baField = document.getElementById(`BA_${productNumber}`);
        const aaField = document.getElementById(`AA_${productNumber}`);
        const colorField = document.getElementById(`Color_${productNumber}`);
        const commentField = document.getElementById(`Comment_${productNumber}`);

        if (daField) daField.value = product.quantities.DA || 0;
        if (caField) caField.value = product.quantities.CA || 0;
        if (baField) baField.value = product.quantities.BA || 0;
        if (aaField) aaField.value = product.quantities.AA || 0;
        if (colorField) colorField.value = product.color || '';
        if (commentField) commentField.value = product.comment || '';
    }

    updateSimpleProductFields(productNumber, product) {
        const quantityField = document.getElementById(`quantity_${productNumber}`);
        const colorField = document.getElementById(`Color_${productNumber}`);
        const commentField = document.getElementById(`Comment_${productNumber}`);
        const frimField = document.getElementById(`frim_${productNumber}`);
        const parcheField = document.getElementById(`parche_${productNumber}`);

        if (quantityField) quantityField.value = product.quantities.DA || 0; // برای سازگاری با backend
        if (colorField) colorField.value = product.color || '';
        if (commentField) commentField.value = product.comment || '';
        if (frimField) frimField.value = ''; // optional
        if (parcheField) parcheField.value = ''; // optional
    }

    clearProductFields(selectName) {
        const productNumber = selectName.replace('Products_List', '');
        const fields = ['DA', 'CA', 'BA', 'AA', 'quantity', 'Color', 'Comment', 'frim_da', 'parche_da', 'frim_ca', 'parche_ca', 'frim_ba', 'parche_ba', 'frim_aa', 'parche_aa', 'frim', 'parche'];
        fields.forEach(field => {
            const elem = document.getElementById(`${field}_${productNumber}`);
            if (elem) elem.value = field.includes('number') ? 0 : '';
        });
    }

    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        
        // مدیریت مراحل - استفاده از event delegation
        document.addEventListener('click', (e) => {
            if (e.target.id === 'next-step-btn' || e.target.closest('#next-step-btn')) {
                e.preventDefault();
                this.nextStep();
            }
            else if (e.target.id === 'prev-step-btn' || e.target.closest('#prev-step-btn')) {
                e.preventDefault();
                this.previousStep();
            }
            else if (e.target.id === 'submit-order-btn' || e.target.closest('#submit-order-btn')) {
                e.preventDefault();
                this.submitOrder();
            }
            else if (e.target.id === 'print-preview-btn' || e.target.closest('#print-preview-btn')) {
                e.preventDefault();
                this.printPreview();
            }
        });

        console.log('✅ All event listeners added');
    }

    setDefaultDates() {
        const orderDate = document.getElementById('order-date');
        const deliveryDate = document.getElementById('delivery-date');
        if (orderDate && deliveryDate) {
            const today = new Date();
            const delivery = new Date(today);
            delivery.setDate(today.getDate() + 27);
            
            // فرض بر استفاده از کتابخانه برای تاریخ جلالی، در غیر اینصورت از toLocaleDateString استفاده کنید
            orderDate.value = today.toLocaleDateString('fa-IR');
            deliveryDate.value = delivery.toLocaleDateString('fa-IR');
        }
    }

    nextStep() {
        if (this.currentStep < this.totalSteps && this.validateStep(this.currentStep)) {
            this.currentStep++;
            this.updateSteps();
        }
    }

    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateSteps();
        }
    }

    updateSteps() {
        document.querySelectorAll('.step-content').forEach(step => step.classList.add('hidden'));
        document.getElementById(`step-${this.currentStep}`).classList.remove('hidden');

        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active', 'completed');
            const stepNum = parseInt(step.dataset.step);
            if (stepNum < this.currentStep) step.classList.add('completed');
            if (stepNum === this.currentStep) step.classList.add('active');
        });

        // نمایش پیش‌نمایش در مرحله 4
        if (this.currentStep === 4) {
            this.collectFormData();
            this.renderOrderPreview();
        }
    }

    validateStep(step) {
        if (step === 1) {
            const name = document.getElementById('customer-name').value.trim();
            const phone = document.getElementById('customer-phone').value.trim();
            const address = document.getElementById('customer-address').value.trim();
            if (!name || !phone || !address || !/^09\d{9}$/.test(phone)) {
                this.showError('اطلاعات مشتری کامل نیست');
                return false;
            }
        } else if (step === 2) {
            this.collectProducts(); // جمع‌آوری محصولات
            if (this.orderData.products.length === 0) {
                this.showError('حداقل یک محصول انتخاب کنید');
                return false;
            }
        }
        return true;
    }

    collectFormData() {
        this.orderData.customer_name = document.getElementById('customer-name')?.value.trim() || '';
        this.orderData.customer_phone = document.getElementById('customer-phone')?.value.trim() || '';
        this.orderData.customer_address = document.getElementById('customer-address')?.value.trim() || '';
        this.orderData.order_type = document.querySelector('input[name="order-type"]:checked')?.value || 'فروش خانگی';
        this.orderData.payment_method = document.querySelector('input[name="payment-method"]:checked')?.value || 'نقدی';
        this.collectProducts();
    }

    collectProducts() {
        this.orderData.products = [];
        document.querySelectorAll('.product-selector').forEach(select => {
            const productName = select.value;
            if (productName !== '0') {
                const status = parseInt(select.dataset.status);
                const productNumber = select.name.replace('Products_List', '');
                const product = {
                    type: status,
                    name: productName
                };

                if (status === 11) {
                    product.quantities = {
                        DA: parseInt(document.getElementById(`DA_${productNumber}`)?.value || 0),
                        CA: parseInt(document.getElementById(`CA_${productNumber}`)?.value || 0),
                        BA: parseInt(document.getElementById(`BA_${productNumber}`)?.value || 0),
                        AA: parseInt(document.getElementById(`AA_${productNumber}`)?.value || 0)
                    };
                    product.frim_da = document.getElementById(`frim_da_${productNumber}`)?.value || '';
                    product.parche_da = document.getElementById(`parche_da_${productNumber}`)?.value || '';
                    product.frim_ca = document.getElementById(`frim_ca_${productNumber}`)?.value || '';
                    product.parche_ca = document.getElementById(`parche_ca_${productNumber}`)?.value || '';
                    product.frim_ba = document.getElementById(`frim_ba_${productNumber}`)?.value || '';
                    product.parche_ba = document.getElementById(`parche_ba_${productNumber}`)?.value || '';
                    product.frim_aa = document.getElementById(`frim_aa_${productNumber}`)?.value || '';
                    product.parche_aa = document.getElementById(`parche_aa_${productNumber}`)?.value || '';
                } else {
                    product.quantity = parseInt(document.getElementById(`quantity_${productNumber}`)?.value || 0);
                    if (status === 3) {
                        product.frim = document.getElementById(`frim_${productNumber}`)?.value || '';
                        product.parche = document.getElementById(`parche_${productNumber}`)?.value || '';
                    }
                }

                product.color = document.getElementById(`Color_${productNumber}`)?.value || '';
                product.comment = document.getElementById(`Comment_${productNumber}`)?.value || '';

                if ((status === 11 && Object.values(product.quantities).some(q => q > 0)) || (status !== 11 && product.quantity > 0)) {
                    this.orderData.products.push(product);
                }
            }
        });
    }

    renderOrderPreview() {
        const previewContainer = document.getElementById('order-preview');
        if (!previewContainer) return;

        let html = `
            <div class="preview-section mb-4">
                <h3 class="text-white font-bold mb-2">اطلاعات مشتری</h3>
                <p>نام: ${this.orderData.customer_name}</p>
                <p>تلفن: ${this.orderData.customer_phone}</p>
                <p>آدرس: ${this.orderData.customer_address}</p>
                <p>نوع خرید: ${this.orderData.order_type}</p>
            </div>
            <div class="preview-section mb-4">
                <h3 class="text-white font-bold mb-2">محصولات</h3>
        `;

        this.orderData.products.forEach(product => {
            html += `
                <div class="bg-white/5 p-3 rounded mb-2">
                    <p class="font-bold">${product.name} (${this.getProductTypeName(product.type)})</p>
                    ${product.type === 11 ? `
                        <p>تک نفره: ${product.quantities.DA}</p>
                        <p>دو نفره: ${product.quantities.CA}</p>
                        <p>سه نفره: ${product.quantities.BA}</p>
                        <p>کنج/پاف: ${product.quantities.AA}</p>
                    ` : `
                        <p>تعداد: ${product.quantity}</p>
                    `}
                    ${product.color ? `<p>رنگ: ${product.color}</p>` : ''}
                    ${product.comment ? `<p>توضیحات: ${product.comment}</p>` : ''}
                </div>
            `;
        });

        html += `
            </div>
            <div class="preview-section">
                <h3 class="text-white font-bold mb-2">پرداخت</h3>
                <p>روش: ${this.orderData.payment_method}</p>
            </div>
        `;

        previewContainer.innerHTML = html;
    }

    getProductTypeName(type) {
        const types = {
            11: 'مبل',
            2: 'جلو مبلی',
            3: 'صندلی غذا خوری',
            4: 'میز غذا خوری',
            5: 'عسلی',
            6: 'سایر',
            7: 'کنسول',
            8: 'میز تلویزیون',
            9: 'سرویس خواب'
        };
        return types[type] || 'سایر';
    }

    async submitOrder() {
        try {
            this.showLoading('در حال ثبت سفارش...');
            
            // جمع‌آوری نهایی داده‌ها
            this.collectFormData();
            
            // اعتبارسنجی نهایی
            if (!this.validateOrder()) {
                this.hideLoading();
                return;
            }

            console.log('📤 Submitting order:', this.orderData);

            // ارسال به API
            const response = await this.apiClient.post('orders/create', this.orderData);
            
            this.hideLoading();
            
            if (response.success) {
                console.log('✅ Order submitted successfully:', response.data);
                this.showSuccess('سفارش با موفقیت ثبت شد!');
                this.showSuccess(`سریال تولید: ${response.data.serial}`);
                
                // نمایش اطلاعات سفارش ثبت شده
                this.showOrderConfirmation(response.data);
                
            } else {
                console.error('❌ API returned error:', response.error);
                this.showError('خطا در ثبت سفارش در سرور: ' + (response.error || 'خطای ناشناخته'));
            }

        } catch (error) {
            this.hideLoading();
            console.error('❌ Order submission error:', error);
            this.showError('خطا در ثبت سفارش: ' + error.message);
        }
    }

    validateOrder() {
        // اعتبارسنجی اطلاعات مشتری
        if (!this.orderData.customer_name.trim()) {
            this.showError('نام مشتری الزامی است');
            return false;
        }
        
        if (!this.orderData.customer_phone.trim() || !/^09\d{9}$/.test(this.orderData.customer_phone)) {
            this.showError('شماره تلفن معتبر الزامی است');
            return false;
        }
        
        if (!this.orderData.customer_address.trim() || this.orderData.customer_address.length < 10) {
            this.showError('آدرس کامل الزامی است');
            return false;
        }
        
        // اعتبارسنجی محصولات
        if (this.orderData.products.length === 0) {
            this.showError('حداقل یک محصول باید انتخاب شود');
            return false;
        }
        
        return true;
    }

    showOrderConfirmation(orderData) {
        const previewContainer = document.getElementById('order-preview');
        if (previewContainer) {
            const successDiv = document.createElement('div');
            successDiv.className = 'bg-green-500/20 border border-green-500 text-green-300 rounded-lg p-4 mb-4';
            successDiv.innerHTML = `
                <div class="flex items-center">
                    <i class="fas fa-check-circle text-xl ml-2"></i>
                    <div>
                        <div class="font-bold">سفارش با موفقیت ثبت شد!</div>
                        <div class="text-sm mt-1">سریال تولید: <strong>${orderData.serial}</strong></div>
                        <div class="text-sm">تاریخ ثبت: ${orderData.order_date}</div>
                    </div>
                </div>
            `;
            previewContainer.prepend(successDiv);
        }
        
        // غیرفعال کردن دکمه ثبت
        const submitBtn = document.getElementById('submit-order-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-check ml-2"></i> سفارش ثبت شد';
        }
        
        // فعال کردن دکمه چاپ
        const printBtn = document.getElementById('print-preview-btn');
        if (printBtn) {
            printBtn.style.display = 'flex';
        }
        
        this.showSuccess('می‌توانید از سفارش پرینت بگیرید یا به داشبورد بازگردید');
    }

    printPreview() {
        this.printOrder();
    }

    printOrder() {
        const printContent = this.generatePrintHTML();
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html dir="rtl">
                <head>
                    <title>پرینت سفارش - سیستم چستر</title>
                    <meta charset="UTF-8">
                    <style>
                        body { 
                            font-family: Tahoma, Arial; 
                            padding: 20px; 
                            background: white;
                            color: black;
                            line-height: 1.6;
                        }
                        .print-header { 
                            text-align: center; 
                            margin-bottom: 30px;
                            border-bottom: 2px solid #333;
                            padding-bottom: 15px;
                        }
                        .print-section { 
                            margin-bottom: 25px;
                            page-break-inside: avoid;
                        }
                        .print-section h3 {
                            background: #f8f9fa;
                            padding: 10px 15px;
                            border-right: 4px solid #3498db;
                            margin: 0 0 15px 0;
                            font-size: 1.2em;
                        }
                        .print-item { 
                            display: flex; 
                            justify-content: space-between;
                            margin-bottom: 8px;
                            padding: 0 15px;
                            font-size: 0.9em;
                        }
                        .print-product {
                            border: 1px solid #ddd;
                            margin-bottom: 10px;
                            padding: 10px 15px;
                            border-radius: 5px;
                            background: #f9f9f9;
                        }
                        @media print {
                            body { padding: 15px; }
                            .print-section { page-break-inside: avoid; }
                        }
                    </style>
                </head>
                <body>
                    ${printContent}
                </body>
            </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
        }, 500);
    }

    generatePrintHTML() {
        const totalItems = this.orderData.products.reduce((sum, product) => {
            if (product.type === 11) {
                return sum + (product.quantities.DA + product.quantities.CA + product.quantities.BA + product.quantities.AA);
            } else {
                return sum + product.quantity;
            }
        }, 0);

        return `
            <div class="print-header">
                <h1>سیستم سفارشات چستر</h1>
                <h2>فاکتور سفارش</h2>
                <div style="margin-top: 10px; font-size: 14px; color: #666;">
                    تاریخ چاپ: ${new Date().toLocaleDateString('fa-IR')}
                </div>
            </div>
            
            <div class="print-section">
                <h3>اطلاعات مشتری</h3>
                <div class="print-item">
                    <span>نام کامل:</span>
                    <span>${this.orderData.customer_name}</span>
                </div>
                <div class="print-item">
                    <span>شماره تماس:</span>
                    <span>${this.orderData.customer_phone}</span>
                </div>
                <div class="print-item">
                    <span>آدرس:</span>
                    <span>${this.orderData.customer_address}</span>
                </div>
                <div class="print-item">
                    <span>نوع خرید:</span>
                    <span>${this.orderData.order_type}</span>
                </div>
            </div>

            <div class="print-section">
                <h3>محصولات سفارش (${totalItems} عدد)</h3>
                ${this.orderData.products.map(product => `
                    <div class="print-product">
                        <div class="print-item">
                            <strong>محصول:</strong>
                            <strong>${product.name}</strong>
                        </div>
                        <div class="print-item">
                            <span>دسته:</span>
                            <span>${this.getProductTypeName(product.type)}</span>
                        </div>
                        ${product.type === 11 ? `
                            ${product.quantities.DA > 0 ? `<div class="print-item"><span>تک نفره:</span><span>${product.quantities.DA} عدد</span></div>` : ''}
                            ${product.quantities.CA > 0 ? `<div class="print-item"><span>دو نفره:</span><span>${product.quantities.CA} عدد</span></div>` : ''}
                            ${product.quantities.BA > 0 ? `<div class="print-item"><span>سه نفره:</span><span>${product.quantities.BA} عدد</span></div>` : ''}
                            ${product.quantities.AA > 0 ? `<div class="print-item"><span>کنج/پاف:</span><span>${product.quantities.AA} عدد</span></div>` : ''}
                        ` : `
                            <div class="print-item">
                                <span>تعداد:</span>
                                <span>${product.quantity} عدد</span>
                            </div>
                        `}
                        ${product.color ? `<div class="print-item"><span>رنگ:</span><span>${product.color}</span></div>` : ''}
                        ${product.comment ? `<div class="print-item"><span>توضیحات:</span><span>${product.comment}</span></div>` : ''}
                    </div>
                `).join('')}
            </div>

            <div class="print-section">
                <h3>زمان‌بندی</h3>
                <div class="print-item">
                    <span>تاریخ سفارش:</span>
                    <span>${document.getElementById('order-date')?.value}</span>
                </div>
                <div class="print-item">
                    <span>تاریخ تحویل:</span>
                    <span>${document.getElementById('delivery-date')?.value}</span>
                </div>
            </div>

            <div class="print-section">
                <h3>اطلاعات پرداخت</h3>
                <div class="print-item">
                    <span>روش پرداخت:</span>
                    <span>${this.orderData.payment_method}</span>
                </div>
            </div>
        `;
    }

    // متدهای نمایش پیام و لودینگ
    showError(message) {
        this.showMessage(message, 'error');
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showMessage(message, type) {
        const messageContainer = document.getElementById('message-container') || this.createMessageContainer();
        const messageElement = document.createElement('div');
        
        messageElement.className = `message message-${type} animate__animated animate__fadeIn`;
        messageElement.innerHTML = `
            <div class="message-content flex items-center justify-between">
                <div class="flex items-center">
                    <span class="message-icon ml-2">
                        ${type === 'error' ? '❌' : '✅'}
                    </span>
                    <span class="message-text">${message}</span>
                </div>
                <button class="message-close text-inherit opacity-70 hover:opacity-100" 
                        onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        messageContainer.appendChild(messageElement);
        
        setTimeout(() => {
            if (messageElement.parentElement) {
                messageElement.remove();
            }
        }, 5000);
    }

    showLoading(message = 'در حال پردازش...') {
        let loadingElement = document.getElementById('loading-overlay');
        if (!loadingElement) {
            loadingElement = document.createElement('div');
            loadingElement.id = 'loading-overlay';
            loadingElement.className = 'loading-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50';
            loadingElement.innerHTML = `
                <div class="loading-content bg-white rounded-xl p-6 shadow-2xl max-w-sm text-center">
                    <div class="loading-spinner w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <div class="loading-text text-gray-700 font-medium">${message}</div>
                </div>
            `;
            document.body.appendChild(loadingElement);
        }
    }

    hideLoading() {
        const loadingElement = document.getElementById('loading-overlay');
        if (loadingElement) {
            loadingElement.remove();
        }
    }

    createMessageContainer() {
        const container = document.createElement('div');
        container.id = 'message-container';
        container.className = 'message-container fixed top-4 right-4 z-50 space-y-2 max-w-md';
        document.body.appendChild(container);
        return container;
    }
}

// مقداردهی اولیه
console.log('🔧 Starting OrderManager initialization...');
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM Content Loaded - Creating OrderManager');
    window.orderManager = new OrderManager();
});

console.log('✅ OrderManager.js script loaded');