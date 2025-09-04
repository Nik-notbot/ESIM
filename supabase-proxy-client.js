// Клиент для работы с Supabase через Netlify Functions
class SupabaseProxyClient {
    constructor() {
        this.baseUrl = '/.netlify/functions/supabase-api';
    }

    async request(table, method = 'GET', params = null) {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    table,
                    method,
                    params
                })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Request failed: ${error}`);
            }

            const data = await response.json();
            return { data, error: null };
        } catch (error) {
            console.error('Proxy request error:', error);
            return { data: null, error };
        }
    }

    // Методы для работы с таблицами
    from(table) {
        const self = this;
        return {
            select: async (columns = '*') => {
                const params = { select: columns };
                return self.request(table, 'GET', params);
            },
            insert: async (data) => {
                return self.request(table, 'POST', data);
            },
            update: async (data) => {
                return self.request(table, 'PATCH', data);
            },
            eq: function(column, value) {
                // Для цепочки вызовов
                this.filters = { ...this.filters, [`${column}=eq.${value}`]: true };
                return this;
            }
        };
    }
}

// Экспортируем клиент
window.SupabaseProxyClient = SupabaseProxyClient;